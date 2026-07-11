import slugify from 'slugify';
import { hasSystemRole } from '../../shared/helpers';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/error.middleware';

let coordinatorRoleId: string | null = null;

async function getCoordinatorRoleId(): Promise<string> {
  if (coordinatorRoleId) return coordinatorRoleId;
  const role = await prisma.role.findUnique({ where: { name: 'COORDINATOR' } });
  if (!role) throw new AppError('COORDINATOR role not found', 500);
  coordinatorRoleId = role.id;
  return coordinatorRoleId;
}

let volunteerRoleId: string | null = null;

async function getVolunteerRoleId(): Promise<string> {
  if (volunteerRoleId) return volunteerRoleId;
  const role = await prisma.role.findUnique({ where: { name: 'VOLUNTEER' } });
  if (!role) throw new AppError('VOLUNTEER role not found', 500);
  volunteerRoleId = role.id;
  return volunteerRoleId;
}

export interface RegisterOrgInput {
  name: string;
  slug?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface UpdateOrgInput {
  name?: string;
  slug?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
}

async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name, { lower: true, strict: true });
  let slug = base;
  let counter = 1;
  while (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${base}-${counter}`;
    counter++;
  }
  return slug;
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

  const slug = data.slug ?? await generateUniqueSlug(data.name);

  const org = await prisma.organization.create({
    data: {
      name: data.name,
      slug,
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
  const isSysAdmin = hasSystemRole(user.roleRef.name);

  if (!isOrgAdmin && !isSysAdmin) {
    throw new AppError('Not authorized to update this organization', 403);
  }

  return prisma.organization.update({
    where: { id: orgId },
    data,
  });
}

export async function listOrganizations(params: { status?: string; page: number; limit: number }) {
  const where = params.status
    ? { status: params.status as 'PENDING' | 'ACTIVE' | 'SUSPENDED' }
    : {};

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

  return {
    orgs,
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.ceil(total / params.limit),
  };
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

  const transitions: Record<string, Record<string, string | 'noop'>> = {
    PENDING: { true: 'ACTIVE', false: 'SUSPENDED' },
    ACTIVE: { true: 'noop', false: 'SUSPENDED' },
    SUSPENDED: { true: 'ACTIVE', false: 'noop' },
  };

  const next = transitions[org.status]?.[String(approved)];

  if (!next) {
    throw new AppError('Organization is not in PENDING status', 400);
  }

  if (next === 'noop') {
    return org;
  }

  return prisma.organization.update({
    where: { id: orgId },
    data: {
      status: next as 'ACTIVE' | 'SUSPENDED',
      verifiedAt: next === 'ACTIVE' ? new Date() : null,
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

export async function getAdminOrganizationDetails(orgId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      address: true,
      phone: true,
      email: true,
      website: true,
      logo: true,
      status: true,
      verifiedAt: true,
      createdAt: true,
      updatedAt: true,
      socialMedia: true,
      documents: {
        select: { id: true, fileName: true, fileUrl: true, type: true, uploadedAt: true },
        orderBy: { uploadedAt: 'desc' },
      },
      _count: { select: { users: true, opportunities: true } },
    },
  });

  if (!org) {
    throw new AppError('Organization not found', 404);
  }

  const [activeOpps, eventsCount, applicationsResult, activeVolsResult] = await Promise.all([
    prisma.opportunity.count({
      where: { organizationId: orgId, status: 'ACTIVE' },
    }),
    prisma.event.count({
      where: { opportunity: { organizationId: orgId } },
    }),
    prisma.application.aggregate({
      where: { opportunity: { organizationId: orgId } },
      _count: true,
    }),
    prisma.application.groupBy({
      by: ['volunteerId'],
      where: {
        opportunity: { organizationId: orgId },
        status: 'ACCEPTED',
      },
    }),
  ]);

  const { documents, _count, ...orgData } = org;

  return {
    ...orgData,
    documents,
    stats: {
      staffCount: _count.users,
      opportunitiesCount: _count.opportunities,
      activeOpportunitiesCount: activeOpps,
      eventsCount,
      applicationsCount: applicationsResult._count,
      activeVolunteersCount: activeVolsResult.length,
    },
  };
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

  const isSysAdmin = hasSystemRole(admin.roleRef.name);
  const isOrgAdmin = admin.roleRef.name === 'ORGANIZATION_ADMIN' && admin.organizationId === orgId;

  if (!isSysAdmin && !isOrgAdmin) {
    throw new AppError('Unauthorized to add coordinators to this organization', 403);
  }

  const coordinatorRoleId = await getCoordinatorRoleId();

  const email = data.email.toLowerCase();
  return prisma.user.upsert({
    where: { email },
    update: {
      roleId: coordinatorRoleId,
      organizationId: orgId,
    },
    create: {
      email,
      name: data.name,
      roleId: coordinatorRoleId,
      organizationId: orgId,
      status: 'ACTIVE',
    },
  });
}

export async function listCoordinators(orgId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const where = {
    organizationId: orgId,
    roleRef: { name: 'COORDINATOR' },
  };
  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getPublicOrganizationBySlug(slug: string) {
  const org = await prisma.organization.findUnique({
    where: { slug },
    select: {
      name: true,
      slug: true,
      description: true,
      logo: true,
      website: true,
      socialMedia: true,
      email: true,
      phone: true,
      _count: { select: { opportunities: true } },
    },
  });

  return org;
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

  const isSysAdmin = hasSystemRole(admin.roleRef.name);
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

  const volunteerRoleId = await getVolunteerRoleId();

  return prisma.user.update({
    where: { id: userIdToRemove },
    data: {
      organizationId: null,
      roleId: volunteerRoleId,
    },
  });
}
