import type { StaffProfileInput, VolunteerProfileInput } from '@/shared';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/error.middleware';

// ─── Extended User Functions ──────────────────────────────────────

export async function getUserProfile(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { profile: true, location: true },
  });

  if (!user) {
    throw new AppError('User not found', 404);
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
  filters: CoordinatorVolunteersFilters,
  pagination: CoordinatorVolunteersPagination
) {
  const { search, skills } = filters;
  const { page, limit } = pagination;

  // Fetch all volunteers with ACCEPTED applications to coordinator's opportunities
  const allVolunteers = await prisma.user.findMany({
    where: {
      role: 'VOLUNTEER',
      applications: {
        some: {
          status: 'ACCEPTED',
          opportunity: { createdById: coordinatorId },
        },
      },
    },
    include: {
      profile: { select: { skills: true, totalHours: true } },
      _count: {
        select: {
          applications: {
            where: { opportunity: { createdById: coordinatorId } },
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

export async function exportCoordinatorVolunteers(coordinatorId: string) {
  const volunteers = await prisma.user.findMany({
    where: {
      role: 'VOLUNTEER',
      applications: {
        some: {
          status: 'ACCEPTED',
          opportunity: { createdById: coordinatorId },
        },
      },
    },
    include: {
      profile: { select: { skills: true, totalHours: true } },
      _count: {
        select: {
          applications: {
            where: { opportunity: { createdById: coordinatorId } },
          },
        },
      },
    },
  });

  return volunteers.map((u) => ({
    name: u.name,
    email: u.email ?? '',
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
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
}

export async function upsertVolunteerProfile(userId: string, data: VolunteerProfileInput) {
  return prisma.volunteerProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: { ...data },
  });
}

export async function upsertStaffProfile(userId: string, data: StaffProfileInput) {
  // Find or create location
  const location = await prisma.location.upsert({
    where: {
      // Use a composite-like approach: find by name+district+state
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

  // Associate user with location
  return prisma.user.update({
    where: { id: userId },
    data: { locationId: location.id },
    include: { location: true },
  });
}
