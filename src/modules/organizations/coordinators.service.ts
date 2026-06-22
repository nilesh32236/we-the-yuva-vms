import { hasSystemRole } from '../../shared/helpers';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/error.middleware';

export async function addCoordinator(
  orgId: string,
  callerId: string,
  data: { name: string; email: string }
) {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) throw new AppError('Organization not found', 404);

  const caller = await prisma.user.findUnique({
    where: { id: callerId },
    select: { organizationId: true, roleRef: { select: { name: true } } },
  });
  if (!caller) throw new AppError('Caller not found', 404);

  const isOrgAdmin =
    caller.organizationId === orgId && caller.roleRef.name === 'ORGANIZATION_ADMIN';
  const isSysAdmin = hasSystemRole(caller.roleRef.name);
  if (!isOrgAdmin && !isSysAdmin) {
    throw new AppError('Not authorized to add coordinators to this organization', 403);
  }

  const coordinatorRole = await prisma.role.findUnique({ where: { name: 'COORDINATOR' } });
  if (!coordinatorRole) throw new AppError('COORDINATOR role not found', 500);

  try {
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        roleId: coordinatorRole.id,
        organizationId: orgId,
        status: 'ACTIVE',
        consent: { create: { privacyPolicyAccepted: true, mediaConsentAccepted: false } },
      },
      select: { id: true, name: true, email: true, status: true, createdAt: true },
    });
    return user;
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === 'P2002') {
      throw new AppError('Email already registered', 409);
    }
    throw err;
  }
}

export async function listCoordinators(orgId: string) {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) throw new AppError('Organization not found', 404);

  const coordinatorRole = await prisma.role.findUnique({ where: { name: 'COORDINATOR' } });
  if (!coordinatorRole) throw new AppError('COORDINATOR role not found', 500);

  const coordinators = await prisma.user.findMany({
    where: { organizationId: orgId, roleId: coordinatorRole.id },
    select: { id: true, name: true, email: true, status: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  return coordinators;
}

export async function removeCoordinator(
  orgId: string,
  coordinatorUserId: string,
  callerId: string
) {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) throw new AppError('Organization not found', 404);

  const caller = await prisma.user.findUnique({
    where: { id: callerId },
    select: { organizationId: true, roleRef: { select: { name: true } } },
  });
  if (!caller) throw new AppError('Caller not found', 404);

  const isOrgAdmin =
    caller.organizationId === orgId && caller.roleRef.name === 'ORGANIZATION_ADMIN';
  const isSysAdmin = hasSystemRole(caller.roleRef.name);
  if (!isOrgAdmin && !isSysAdmin) {
    throw new AppError('Not authorized to remove coordinators from this organization', 403);
  }

  const coordinator = await prisma.user.findUnique({
    where: { id: coordinatorUserId },
    select: { id: true, organizationId: true, roleRef: { select: { name: true } } },
  });
  if (!coordinator) throw new AppError('Coordinator not found', 404);
  if (coordinator.organizationId !== orgId) {
    throw new AppError('User is not a coordinator of this organization', 400);
  }

  // Remove org link and reset to VOLUNTEER role
  const volunteerRole = await prisma.role.findUnique({ where: { name: 'VOLUNTEER' } });
  if (!volunteerRole) throw new AppError('VOLUNTEER role not found', 500);

  return prisma.user.update({
    where: { id: coordinatorUserId },
    data: { organizationId: null, roleId: volunteerRole.id },
    select: { id: true, name: true, email: true, status: true },
  });
}
