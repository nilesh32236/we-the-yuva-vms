import type { OpportunityInput } from '@/shared';
import { logAudit } from '../../lib/audit';
import { prisma } from '../../lib/prisma';
import { notificationsQueue } from '../../lib/queue';
import { redis } from '../../lib/redis';
import { AppError } from '../../middleware/error.middleware';

// ─── Helpers ─────────────────────────────────────────────────────

async function invalidateListCache(): Promise<void> {
  if (!redis) return;
  let cursor = '0';
  do {
    const [nextCursor, keys] = await redis.scan(
      cursor,
      'MATCH',
      'opportunities:list:*',
      'COUNT',
      100
    );
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    cursor = nextCursor;
  } while (cursor !== '0');
}

// ─── Opportunity CRUD ─────────────────────────────────────────────

export async function createOpportunity(coordinatorId: string, data: OpportunityInput) {
  const opportunity = await prisma.opportunity.create({
    data: {
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      createdById: coordinatorId,
      status: 'ACTIVE',
    },
  });

  await invalidateListCache();

  await logAudit({
    userId: coordinatorId,
    action: 'OPPORTUNITY_CREATE',
    targetId: opportunity.id,
    targetType: 'Opportunity',
  });

  await notificationsQueue
    ?.add('match-alert-subscriptions', { opportunityId: opportunity.id })
    .catch(() => {});

  return opportunity;
}

export interface OpportunityFilters {
  category?: string;
  skills?: string[];
  isRemote?: boolean;
  locationId?: string;
  search?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export async function listOpportunities(filters: OpportunityFilters, pagination: PaginationParams) {
  const cacheKey = `opportunities:list:${JSON.stringify({ filters, pagination })}`;

  if (redis) {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  }

  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  // TODO: include requesting user's application status in production
  // Currently doesn't eager-load the user's application for performance
  // Build where clause
  const where: Record<string, unknown> = { status: 'ACTIVE' };

  if (filters.category) {
    where.category = filters.category;
  }
  if (filters.skills && filters.skills.length > 0) {
    where.skills = { hasSome: filters.skills };
  }
  if (filters.isRemote !== undefined) {
    where.isRemote = filters.isRemote;
  }
  if (filters.locationId) {
    where.locationId = filters.locationId;
  }
  if (filters.search) {
    where.title = { contains: filters.search, mode: 'insensitive' };
  }

  const [data, total] = await Promise.all([
    prisma.opportunity.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        location: true,
        createdBy: { select: { name: true } },
        _count: { select: { applications: { where: { status: 'ACCEPTED' } } } },
      },
    }),
    prisma.opportunity.count({ where }),
  ]);

  const result = {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };

  // Cache for 60 seconds
  if (redis) {
    await redis.set(cacheKey, JSON.stringify(result), 'EX', 60);
  }

  return result;
}

export async function getOpportunityById(id: string) {
  const opportunity = await prisma.opportunity.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true } },
      location: true,
      _count: { select: { applications: { where: { status: 'ACCEPTED' } } } },
    },
  });

  if (!opportunity) {
    throw new AppError('Opportunity not found', 404);
  }

  return opportunity;
}

export async function updateOpportunity(
  id: string,
  callerId: string,
  callerRole: string,
  data: OpportunityInput
) {
  const opportunity = await prisma.opportunity.findUnique({ where: { id } });

  if (!opportunity) {
    throw new AppError('Opportunity not found', 404);
  }

  if (callerRole !== 'ADMIN' && opportunity.createdById !== callerId) {
    throw new AppError('Forbidden', 403);
  }

  const updated = await prisma.opportunity.update({
    where: { id },
    data: {
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    },
  });

  await logAudit({
    userId: callerId,
    action: 'OPPORTUNITY_UPDATE',
    targetId: id,
    targetType: 'Opportunity',
  });

  await invalidateListCache();
  return updated;
}

export async function closeOpportunity(id: string, callerId: string, callerRole: string) {
  const opportunity = await prisma.opportunity.findUnique({ where: { id } });

  if (!opportunity) {
    throw new AppError('Opportunity not found', 404);
  }

  if (callerRole !== 'ADMIN' && opportunity.createdById !== callerId) {
    throw new AppError('Forbidden', 403);
  }

  const closed = await prisma.opportunity.update({
    where: { id },
    data: { status: 'CLOSED' },
  });

  await logAudit({
    userId: callerId,
    action: 'OPPORTUNITY_DELETE',
    targetId: id,
    targetType: 'Opportunity',
    metadata: { status: 'CLOSED' },
  });

  await invalidateListCache();
  return closed;
}

// ─── Applications ─────────────────────────────────────────────────

export async function applyToOpportunity(opportunityId: string, volunteerId: string) {
  return prisma.$transaction(
    async (tx) => {
      const opportunity = await tx.opportunity.findUnique({ where: { id: opportunityId } });

      if (!opportunity) {
        throw new AppError('Opportunity not found', 404);
      }

      if (opportunity.status !== 'ACTIVE') {
        throw new AppError('Opportunity is not accepting applications', 400);
      }

      const acceptedCount = await tx.application.count({
        where: { opportunityId, status: 'ACCEPTED' },
      });

      if (acceptedCount >= opportunity.totalSlots) {
        throw new AppError('No slots available', 400);
      }

      try {
        const application = await tx.application.create({
          data: {
            opportunityId,
            volunteerId,
            status: 'PENDING',
          },
        });
        await logAudit({
          userId: volunteerId,
          action: 'APPLICATION_CREATE',
          targetId: application.id,
          targetType: 'Application',
          metadata: { opportunityId },
        });
        return application;
      } catch (err: unknown) {
        if ((err as { code?: string })?.code === 'P2002') {
          throw new AppError('Already applied', 409);
        }
        throw err;
      }
    },
    { isolationLevel: 'Serializable' }
  );
}

export async function listMyApplications(volunteerId: string, pagination?: PaginationParams) {
  if (!pagination) {
    return prisma.application.findMany({
      where: { volunteerId },
      select: { id: true, opportunityId: true, status: true, appliedAt: true },
      orderBy: { appliedAt: 'desc' },
    });
  }
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.application.findMany({
      where: { volunteerId },
      skip,
      take: limit,
      select: { id: true, opportunityId: true, status: true, appliedAt: true },
      orderBy: { appliedAt: 'desc' },
    }),
    prisma.application.count({ where: { volunteerId } }),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function listApplications(
  opportunityId: string,
  pagination: { page: number; limit: number }
) {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;
  const where = { opportunityId };
  const [data, total] = await Promise.all([
    prisma.application.findMany({
      where,
      skip,
      take: limit,
      include: {
        volunteer: {
          select: {
            name: true,
            email: true,
            profile: { select: { skills: true } },
          },
        },
      },
      orderBy: { appliedAt: 'desc' },
    }),
    prisma.application.count({ where }),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function withdrawApplication(applicationId: string, userId: string) {
  const application = await prisma.application.findUnique({ where: { id: applicationId } });
  if (!application) throw new AppError('Application not found', 404);
  if (application.volunteerId !== userId) throw new AppError('Forbidden', 403);
  if (application.status !== 'PENDING')
    throw new AppError('Only pending applications can be withdrawn', 400);
  // TODO: use proper WITHDRAWN status in production
  // Currently sets status to REJECTED (only option in ApplicationStatus enum)
  const updated = await prisma.application.update({
    where: { id: applicationId },
    data: { status: 'REJECTED' },
  });
  await logAudit({
    userId,
    action: 'APPLICATION_UPDATE',
    targetId: applicationId,
    metadata: { status: 'WITHDRAWN', opportunityId: application.opportunityId },
  });
  return updated;
}

export async function updateApplicationStatus(
  applicationId: string,
  status: 'ACCEPTED' | 'REJECTED',
  callerId: string,
  callerRole: string
) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { opportunity: true },
  });

  if (!application) {
    throw new AppError('Application not found', 404);
  }

  if (callerRole !== 'ADMIN' && application.opportunity.createdById !== callerId) {
    throw new AppError('Forbidden', 403);
  }

  const updated = await prisma.$transaction(
    async (tx) => {
      if (status === 'ACCEPTED') {
        const acceptedCount = await tx.application.count({
          where: { opportunityId: application.opportunityId, status: 'ACCEPTED' },
        });
        if (acceptedCount >= application.opportunity.totalSlots) {
          throw new AppError('No slots available', 400);
        }
      }
      const updatedApplication = await tx.application.update({
        where: { id: applicationId },
        data: { status },
      });
      await logAudit({
        userId: callerId,
        action: 'APPLICATION_UPDATE',
        targetId: applicationId,
        metadata: { status, opportunityId: application.opportunityId },
      });
      return updatedApplication;
    },
    { isolationLevel: 'Serializable' }
  );

  // Enqueue notification (non-blocking)
  notificationsQueue
    ?.add(`application-${status.toLowerCase()}`, {
      volunteerId: application.volunteerId,
      opportunityTitle: application.opportunity.title,
      opportunityId: application.opportunityId,
    })
    .catch(() => {});

  return updated;
}
