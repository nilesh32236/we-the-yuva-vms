import type { OnboardingInput, StaffProfileInput, VolunteerProfileInput } from '@/shared';
import type { Prisma } from '@prisma/client';
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
      select: {
        id: true,
        name: true,
        email: true,
        roleRef: { select: { name: true } },
        organizationId: true,
        status: true,
        locationId: true,
        volunteerType: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            id: true,
            bio: true,
            skills: true,
            interests: true,
            availability: true,
            totalHours: true,
            currentStreak: true,
            longestStreak: true,
            avatarUrl: true,
            education: true,
            details: true,
          },
        },
        location: true,
      },
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
    select: {
      id: true,
      name: true,
      email: true,
      roleRef: { select: { name: true } },
      organizationId: true,
      status: true,
      locationId: true,
      volunteerType: true,
      createdAt: true,
      updatedAt: true,
      profile: {
        select: {
          id: true,
          bio: true,
          skills: true,
          interests: true,
          availability: true,
          totalHours: true,
          currentStreak: true,
          longestStreak: true,
          avatarUrl: true,
          education: true,
          details: true,
        },
      },
      location: true,
    },
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

  const where: Prisma.UserWhereInput = {
    roleRef: { name: 'VOLUNTEER' },
    applications: {
      some: {
        status: 'ACCEPTED',
        opportunity: opportunityFilter,
      },
    },
  };

  if (search) {
    const q = search;
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
    ];
  }

  if (skills && skills.length > 0) {
    where.profile = { skills: { hasSome: skills } };
  }

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
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
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

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

  // Limit to 10k rows to prevent OOM; use streaming/paginated iteration for larger exports
  const volunteers = await prisma.user.findMany({
    take: 10000,
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

export async function getProfileStatus(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      volunteerType: true,
      profileComplete: true,
      profile: { select: { skills: true, interests: true, availability: true } },
    },
  });

  if (!user) throw new AppError('User not found', 404);

  if (user.profileComplete && user.profile) {
    return {
      isComplete: true,
      missingFields: [],
      completionPercentage: 100,
    };
  }

  const missingFields: string[] = [];

  const hasSkills = (user.profile?.skills?.length ?? 0) > 0;
  const hasInterests = (user.profile?.interests?.length ?? 0) > 0;
  const hasVolunteerType = user.volunteerType != null;

  const availability = user.profile?.availability as
    | { days?: string[]; timeSlots?: string[] }
    | undefined;
  const hasAvailability =
    availability != null &&
    (availability.days?.length ?? 0) > 0 &&
    (availability.timeSlots?.length ?? 0) > 0;

  if (!hasSkills) missingFields.push('skills');
  if (!hasInterests) missingFields.push('interests');
  if (!hasVolunteerType) missingFields.push('volunteerType');
  if (!hasAvailability) missingFields.push('availability');

  const totalFields = 4;
  const filled = totalFields - missingFields.length;
  const completionPercentage = Math.round((filled / totalFields) * 100);
  const isComplete = missingFields.length === 0;

  return { isComplete, missingFields, completionPercentage };
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
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.volunteerType !== undefined) updateData.volunteerType = data.volunteerType;

  try {
    return await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: { profile: true, location: true },
    });
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err && (err as { code: string }).code === 'P2002') {
      throw new AppError('Email already in use', 409);
    }
    throw err;
  }
}

export async function upsertStaffProfile(userId: string, data: StaffProfileInput) {
  return prisma.$transaction(async (tx) => {
    const location = await tx.location.upsert({
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

    await tx.user.update({
      where: { id: userId },
      data: { locationId: location.id },
    });

    await tx.staffProfile.upsert({
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

    return tx.user.findUnique({
      where: { id: userId },
      include: { location: true, staffProfile: true },
    });
  });
}

export async function submitOnboarding(userId: string, data: OnboardingInput) {
  const { step1, step2, step3, step4, step5 } = data;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roleRef: { select: { name: true } } },
  });

  if (!user || user.roleRef.name !== 'VOLUNTEER') {
    throw new AppError('Only volunteers can submit onboarding', 403);
  }

  return prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        volunteerType: step3.volunteerType,
        profileComplete: true,
      },
    });

    const profileData = {
      skills: step1.skills,
      interests: step2.causes,
      availability: {
        pattern: step3.availabilityPattern,
        hoursPerWeek: step3.hoursPerWeek,
        sessionDuration: step3.sessionDuration,
      },
      education: step4.education,
      bio: step5.bio,
      avatarUrl: step5.avatarUrl ?? undefined,
      details: {
        expertise: step1.expertise,
        languages: step1.languages,
        interests: step2.interests,
        preferredActivities: step2.preferredActivities,
        occupation: step4.occupation,
        experience: step4.experience,
        certifications: step4.certifications,
        socialLinks: step5.socialLinks,
        onboardingCompletedAt: new Date().toISOString(),
      },
    };

    return tx.volunteerProfile.upsert({
      where: { userId },
      create: { userId, ...profileData },
      update: profileData,
    });
  });
}
