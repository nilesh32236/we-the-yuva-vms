import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/error.middleware';

export interface RegisterOrgInput {
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface UpdateOrgInput {
  name?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export async function registerOrganization(adminUserId: string, data: RegisterOrgInput) {
  const adminUser = await prisma.user.findUnique({
    where: { id: adminUserId },
    select: { organizationId: true, roleRef: { select: { name: true } } },
  });

  if (!adminUser) {
    throw new AppError('User not found', 404);
  }

  if (adminUser.organizationId) {
    throw new AppError('User already belongs to an organization', 409);
  }

  if (adminUser.roleRef.name !== 'ORGANIZATION_ADMIN') {
    throw new AppError('Only organization admins can register an organization', 403);
  }

  const existing = await prisma.organization.findFirst({
    where: { name: data.name },
  });

  if (existing) {
    throw new AppError('Organization with this name already exists', 409);
  }

  const org = await prisma.organization.create({
    data: {
      name: data.name,
      description: data.description,
      address: data.address,
      phone: data.phone,
      email: data.email,
      website: data.website,
      status: 'PENDING',
      users: { connect: { id: adminUserId } },
    },
    include: { users: { select: { id: true, name: true, email: true } } },
  });

  return org;
}

export async function getOrganization(orgId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      documents: { select: { id: true, fileName: true, type: true, uploadedAt: true } },
      users: { select: { id: true, name: true, email: true, roleRef: { select: { name: true } } } },
    },
  });

  if (!org) {
    throw new AppError('Organization not found', 404);
  }

  return org;
}

export async function updateOrganization(orgId: string, userId: string, data: UpdateOrgInput) {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) {
    throw new AppError('Organization not found', 404);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true, roleRef: { select: { name: true } } },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const isOrgAdmin = user.organizationId === orgId && user.roleRef.name === 'ORGANIZATION_ADMIN';
  const isSysAdmin = user.roleRef.name === 'ADMIN' || user.roleRef.name === 'PLATFORM_MANAGER';

  if (!isOrgAdmin && !isSysAdmin) {
    throw new AppError('Not authorized to update this organization', 403);
  }

  return prisma.organization.update({
    where: { id: orgId },
    data,
  });
}

export async function listOrganizations(params: { status?: string; page: number; limit: number }) {
  const where = params.status ? { status: params.status as 'PENDING' | 'ACTIVE' | 'SUSPENDED' } : {};

  const [orgs, total] = await Promise.all([
    prisma.organization.findMany({
      where,
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        email: true,
        status: true,
        verifiedAt: true,
        createdAt: true,
        _count: { select: { users: true, documents: true } },
      },
    }),
    prisma.organization.count({ where }),
  ]);

  return { orgs, total, page: params.page, limit: params.limit, totalPages: Math.ceil(total / params.limit) };
}

export async function suspendOrganization(orgId: string) {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) throw new AppError('Organization not found', 404);
  if (org.status === 'SUSPENDED') throw new AppError('Organization is already suspended', 400);

  return prisma.organization.update({
    where: { id: orgId },
    data: { status: 'SUSPENDED' },
  });
}

export async function verifyOrganization(orgId: string, approved: boolean) {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) {
    throw new AppError('Organization not found', 404);
  }

  if (org.status !== 'PENDING') {
    throw new AppError('Organization is not in PENDING status', 400);
  }

  return prisma.organization.update({
    where: { id: orgId },
    data: {
      status: approved ? 'ACTIVE' : 'SUSPENDED',
      verifiedAt: approved ? new Date() : null,
    },
  });
}

export async function addOrganizationDocument(
  orgId: string,
  fileName: string,
  fileUrl: string,
  type: string
) {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) {
    throw new AppError('Organization not found', 404);
  }

  return prisma.organizationDocument.create({
    data: { organizationId: orgId, fileName, fileUrl, type },
  });
}

export async function getOrganizationDocuments(orgId: string) {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) {
    throw new AppError('Organization not found', 404);
  }

  return prisma.organizationDocument.findMany({
    where: { organizationId: orgId },
    orderBy: { uploadedAt: 'desc' },
  });
}

export async function addCoordinatorToOrg(
  orgId: string,
  adminUserId: string,
  data: { name: string; email: string }
) {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) {
    throw new AppError('Organization not found', 404);
  }

  const admin = await prisma.user.findUnique({
    where: { id: adminUserId },
    select: { organizationId: true, roleRef: { select: { name: true } } },
  });

  if (!admin) throw new AppError('User not found', 404);

  const isSysAdmin = admin.roleRef.name === 'ADMIN';
  const isOrgAdmin = admin.roleRef.name === 'ORGANIZATION_ADMIN' && admin.organizationId === orgId;

  if (!isSysAdmin && !isOrgAdmin) {
    throw new AppError('Unauthorized to add coordinators to this organization', 403);
  }

  const coordinatorRole = await prisma.role.findUnique({ where: { name: 'COORDINATOR' } });
  if (!coordinatorRole) throw new AppError('COORDINATOR role not found', 500);

  const email = data.email.toLowerCase();
  return prisma.user.upsert({
    where: { email },
    update: {
      roleId: coordinatorRole.id,
      organizationId: orgId,
    },
    create: {
      email,
      name: data.name,
      roleId: coordinatorRole.id,
      organizationId: orgId,
      status: 'ACTIVE',
    },
  });
}

export async function listCoordinators(orgId: string) {
  return prisma.user.findMany({
    where: {
      organizationId: orgId,
      roleRef: { name: 'COORDINATOR' },
    },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      createdAt: true,
    },
  });
}

export async function removeCoordinatorFromOrg(
  orgId: string,
  adminUserId: string,
  userIdToRemove: string
) {
  const admin = await prisma.user.findUnique({
    where: { id: adminUserId },
    select: { organizationId: true, roleRef: { select: { name: true } } },
  });

  if (!admin) throw new AppError('User not found', 404);

  const isSysAdmin = admin.roleRef.name === 'ADMIN';
  const isOrgAdmin = admin.roleRef.name === 'ORGANIZATION_ADMIN' && admin.organizationId === orgId;

  if (!isSysAdmin && !isOrgAdmin) {
    throw new AppError('Unauthorized to remove coordinators from this organization', 403);
  }

  const user = await prisma.user.findUnique({
    where: { id: userIdToRemove },
    select: { organizationId: true, roleRef: { select: { name: true } } },
  });

  if (!user || user.organizationId !== orgId) {
    throw new AppError('Coordinator not found in this organization', 404);
  }

  if (user.roleRef.name !== 'COORDINATOR') {
    throw new AppError('User is not a coordinator', 400);
  }

  const volunteerRole = await prisma.role.findUnique({ where: { name: 'VOLUNTEER' } });
  if (!volunteerRole) throw new AppError('VOLUNTEER role not found', 500);

  return prisma.user.update({
    where: { id: userIdToRemove },
    data: {
      organizationId: null,
      roleId: volunteerRole.id,
    },
  });
}

