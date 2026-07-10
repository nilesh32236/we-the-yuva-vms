import type { StaffProfileInput, VolunteerProfileInput } from '@/shared';
import { hasSystemRole } from '../../shared/helpers';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/error.middleware';

// ─── Extended User Functions ──────────────────────────────────────

export async function getUserProfile(
  id: string,
  callerId: string,
  callerRole: string,
  callerOrgId: string | null | undefined
) {
  const isSysAdmin = hasSystemRole(callerRole);
  const isSelf = id === callerId;

  if (isSysAdmin || isSelf) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { profile: true, location: true },
    });
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  // For coordinators/org admins: can view if user is in their org or applied to their org
  const opportunityFilter = callerOrgId
    ? { organizationId: callerOrgId }
    : { createdById: callerId };

  const user = await prisma.user.findFirst({
    where: {
      id,
      OR: [
        { organizationId: callerOrgId ?? undefined }, // Same org (for other staff)
        {
          applications: {
            some: {
              status: 'ACCEPTED',
              opportunity: opportunityFilter,
            },
          },
        },
      ],
    },
    include: { profile: true, location: true },
  });

  if (!user) {
    throw new AppError('User not found or access denied', 404);
  }

  return user;
}

interface CoordinatorVolunteersFilters {
  search?: string;
  skills?: string[];
}

interface CoordinatorVolunteersPagination {
  page: number;
  limit: number;
}

export async function getCoordinatorVolunteers(
  coordinatorId: string,
  organizationId: string | null | undefined,
  filters: CoordinatorVolunteersFilters,
  pagination: CoordinatorVolunteersPagination
) {
  const { search, skills } = filters;
  const { page, limit } = pagination;

  const opportunityFilter = organizationId ? { organizationId } : { createdById: coordinatorId };

  // Fetch all volunteers with ACCEPTED applications to coordinator's organization or specific opportunities
  const allVolunteers = await prisma.user.findMany({
    where: {
      roleRef: { name: 'VOLUNTEER' },
      applications: {
        some: {
          status: 'ACCEPTED',
          opportunity: opportunityFilter,
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      volunteerType: true,
      profile: { select: { skills: true, totalHours: true } },
      _count: {
        select: {
          applications: {
            where: { opportunity: opportunityFilter },
          },
        },
      },
    },
  });

  // Apply in-memory filters
  let filtered = allVolunteers;

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (u) => u.name.toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q)
    );
  }

  if (skills && skills.length > 0) {
    filtered = filtered.filter((u) => skills.some((s) => u.profile?.skills.includes(s)));
  }

  const total = filtered.length;
  const skip = (page - 1) * limit;
  const data = filtered.slice(skip, skip + limit);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function exportCoordinatorVolunteers(
  coordinatorId: string,
  organizationId: string | null | undefined
) {
  const opportunityFilter = organizationId ? { organizationId } : { createdById: coordinatorId };

  const volunteers = await prisma.user.findMany({
    where: {
      roleRef: { name: 'VOLUNTEER' },
      applications: {
        some: {
          status: 'ACCEPTED',
          opportunity: opportunityFilter,
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      volunteerType: true,
      profile: { select: { skills: true, totalHours: true } },
      _count: {
        select: {
          applications: {
            where: { opportunity: opportunityFilter },
          },
        },
      },
    },
  });

  return volunteers.map((u) => ({
    name: u.name,
    email: u.email ?? '',
    type: u.volunteerType ?? '—',
    skills: u.profile?.skills ?? [],
    totalHours: u.profile?.totalHours ?? 0,
    applicationCount: u._count.applications,
  }));
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      consent: true,
      location: true,
      roleRef: { select: { name: true } },
      currentLevel: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.roleRef.name,
    status: user.status,
    locationId: user.locationId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    volunteerType: user.volunteerType,
    points: user.points,
    currentLevel: user.currentLevel,
    organizationId: user.organizationId,
    profile: user.profile,
    consent: user.consent,
    location: user.location,
  };
}

export async function upsertVolunteerProfile(userId: string, data: VolunteerProfileInput) {
  const { volunteerType, ...profileData } = data;

  return prisma.$transaction(async (tx) => {
    if (volunteerType) {
      await tx.user.update({
        where: { id: userId },
        data: { volunteerType },
      });
    }

    return tx.volunteerProfile.upsert({
      where: { userId },
      create: { userId, ...profileData },
      update: { ...profileData },
    });
  });
}

export async function updateUser(
  userId: string,
  data: { name?: string; email?: string; volunteerType?: string }
) {
  if (data.email) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing && existing.id !== userId) {
      throw new AppError('Email already in use', 409);
    }
  }
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.volunteerType !== undefined) updateData.volunteerType = data.volunteerType;

  return prisma.user.update({
    where: { id: userId },
    data: updateData,
    include: { profile: true, location: true },
  });
}

export async function upsertStaffProfile(userId: string, data: StaffProfileInput) {
  const location = await prisma.location.upsert({
    where: {
      id: `loc-${data.locationName.toLowerCase().replace(/\s+/g, '-')}-${(data.district ?? '').toLowerCase()}-${(data.state ?? '').toLowerCase()}`,
    },
    update: {},
    create: {
      id: `loc-${data.locationName.toLowerCase().replace(/\s+/g, '-')}-${(data.district ?? '').toLowerCase()}-${(data.state ?? '').toLowerCase()}`,
      name: data.locationName,
      district: data.district,
      state: data.state,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { locationId: location.id },
  });

  await prisma.staffProfile.upsert({
    where: { userId },
    create: {
      userId,
      department: data.department,
      designation: data.designation,
    },
    update: {
      department: data.department,
      designation: data.designation,
    },
  });

  return prisma.user.findUnique({
    where: { id: userId },
    include: { location: true, staffProfile: true },
  });
}
