import crypto from 'node:crypto';
import type { Prisma } from '@prisma/client';
import type { OpportunityInput } from '@/shared';
import { z } from 'zod';
import { hasSystemRole } from '../../shared/helpers';
import { onApplicationAccepted } from '../badges/badge-engine.service';
import { logAudit } from '../../lib/audit';
import { sendEmail } from '../../lib/email';
import { logger } from '../../lib/logger';
import { prisma } from '../../lib/prisma';
import { notificationsQueue } from '../../lib/queue';
import { redis } from '../../lib/redis';
import { getProfileStatus } from '../users/users.service';
import { AppError } from '../../middleware/error.middleware';

const CACHE_KEY_SET = 'opportunities:list:keys';

// ─── Helpers ─────────────────────────────────────────────────────

async function invalidateListCache(): Promise<void> {
  if (!redis) return;
  const keys = await redis.smembers(CACHE_KEY_SET);
  if (keys.length > 0) {
    await redis.del(...keys);
    await redis.del(CACHE_KEY_SET);
  }
}

// ─── Opportunity CRUD ─────────────────────────────────────────────

export async function createOpportunity(
  coordinatorId: string,
  organizationId: string | null | undefined,
  data: OpportunityInput
) {
  const opportunity = await prisma.opportunity.create({
    data: {
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      createdById: coordinatorId,
      organizationId,
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
    .catch((err) =>
      logger.warn('Failed to enqueue match-alert notification', { error: (err as Error).message })
    );

  return opportunity;
}

export interface OpportunityFilters {
  category?: string;
  skills?: string[];
  isRemote?: boolean;
  locationId?: string;
  search?: string;
  organizationId?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

function hashFilters(obj: Record<string, unknown>): string {
  return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex').slice(0, 16);
}

const CachedOpportunityItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  isRemote: z.boolean(),
  locationId: z.string().nullable().optional(),
  location: z
    .object({
      id: z.string(),
      name: z.string(),
      district: z.string().nullable().optional(),
      state: z.string().nullable().optional(),
      lat: z.number().nullable().optional(),
      lng: z.number().nullable().optional(),
    })
    .nullable()
    .optional(),
  status: z.string(),
  totalSlots: z.number(),
  startDate: z.string(),
  endDate: z.string(),
  createdAt: z.string(),
  createdBy: z.object({ name: z.string() }),
  _count: z.object({ applications: z.number() }),
  acceptedCount: z.number(),
});

const CachedOpportunitySchema = z.object({
  data: z.array(CachedOpportunityItemSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export async function listOpportunities(
  filters: OpportunityFilters,
  pagination: PaginationParams,
  userId?: string
) {
  const cacheKey = `opportunities:list:${hashFilters({ filters, pagination })}`;

  if (redis && !userId) {
    const cached = await redis.get(cacheKey);
    if (cached) {
      try {
        return CachedOpportunitySchema.parse(JSON.parse(cached));
      } catch {
        logger.warn('Cache parse failed for opportunities list, falling back to DB');
      }
    }
  }

  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const where: Prisma.OpportunityWhereInput = { status: 'ACTIVE' };

  if (filters.category) {
    where.category = filters.category as Prisma.EnumOpportunityCategoryFilter<'Opportunity'>;
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
  if (filters.organizationId) {
    where.organizationId = filters.organizationId;
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
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        isRemote: true,
        locationId: true,
        location: true,
        status: true,
        totalSlots: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        createdBy: { select: { name: true } },
      },
    }),
    prisma.opportunity.count({ where }),
  ]);

  // Batch-fetch accepted and total application counts for all opportunities
  const oppIds = data.map((o) => o.id);
  const [acceptedCounts, totalCounts] = await Promise.all([
    prisma.application.groupBy({
      by: ['opportunityId'],
      where: { opportunityId: { in: oppIds }, status: 'ACCEPTED' },
      _count: { id: true },
    }),
    prisma.application.groupBy({
      by: ['opportunityId'],
      where: { opportunityId: { in: oppIds } },
      _count: { id: true },
    }),
  ]);
  const acceptedMap = new Map(acceptedCounts.map((c) => [c.opportunityId, c._count.id]));
  const totalMap = new Map(totalCounts.map((c) => [c.opportunityId, c._count.id]));

  let enriched = data;
  if (userId) {
    const userApps = await prisma.application.findMany({
      where: { opportunityId: { in: oppIds }, volunteerId: userId },
      select: { opportunityId: true, status: true },
    });
    const appMap = new Map(userApps.map((a) => [a.opportunityId, a]));
    enriched = data.map((opp) => ({
      ...opp,
      _count: { applications: totalMap.get(opp.id) ?? 0 },
      acceptedCount: acceptedMap.get(opp.id) ?? 0,
      userApplication: appMap.has(opp.id) ? { status: appMap.get(opp.id)!.status } : null,
    }));
  } else {
    enriched = data.map((opp) => ({
      ...opp,
      _count: { applications: totalMap.get(opp.id) ?? 0 },
      acceptedCount: acceptedMap.get(opp.id) ?? 0,
    }));
  }

  const result = {
    data: enriched,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };

  if (redis && !userId) {
    await redis
      .multi()
      .sadd(CACHE_KEY_SET, cacheKey)
      .set(cacheKey, JSON.stringify(result), 'EX', 300)
      .exec();
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
  callerOrgId: string | null | undefined,
  data: OpportunityInput
) {
  const opportunity = await prisma.opportunity.findUnique({ where: { id } });

  if (!opportunity) {
    throw new AppError('Opportunity not found', 404);
  }

  const isSysAdmin = hasSystemRole(callerRole);
  const isOwner = opportunity.createdById === callerId;
  const isSameOrg =
    opportunity.organizationId && callerOrgId && opportunity.organizationId === callerOrgId;

  if (!isSysAdmin && !isOwner && !isSameOrg) {
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

export async function closeOpportunity(
  id: string,
  callerId: string,
  callerRole: string,
  callerOrgId: string | null | undefined
) {
  const opportunity = await prisma.opportunity.findUnique({ where: { id } });

  if (!opportunity) {
    throw new AppError('Opportunity not found', 404);
  }

  const isSysAdmin = hasSystemRole(callerRole);
  const isOwner = opportunity.createdById === callerId;
  const isSameOrg =
    opportunity.organizationId && callerOrgId && opportunity.organizationId === callerOrgId;

  if (!isSysAdmin && !isOwner && !isSameOrg) {
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
  // Profile completeness check
  const profileStatus = await getProfileStatus(volunteerId);
  if (!profileStatus.isComplete) {
    throw new AppError(
      'Complete your profile before applying to opportunities',
      403,
      'PROFILE_INCOMPLETE',
      {
        missingFields: profileStatus.missingFields,
        completionPercentage: profileStatus.completionPercentage,
      }
    );
  }

  // Fetch opportunity info before transaction for notification
  const oppInfo = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    select: { id: true, title: true, createdById: true },
  });

  const application = await prisma.$transaction(async (tx) => {
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
      const app = await tx.application.create({
        data: {
          opportunityId,
          volunteerId,
          status: 'PENDING',
        },
      });
      await logAudit({
        userId: volunteerId,
        action: 'APPLICATION_CREATE',
        targetId: app.id,
        targetType: 'Application',
        metadata: { opportunityId },
      });
      return app;
    } catch (err: unknown) {
      if ((err as { code?: string })?.code === 'P2002') {
        throw new AppError('Already applied', 409);
      }
      throw err;
    }
  });

  // Notify the opportunity creator (non-blocking)
  if (oppInfo?.createdById && oppInfo.createdById !== volunteerId) {
    const notify = async () => {
      const volunteer = await prisma.user
        .findUnique({ where: { id: volunteerId }, select: { name: true } })
        .catch(() => null);
      const volunteerName = volunteer?.name || 'A volunteer';

      if (notificationsQueue) {
        try {
          await notificationsQueue.add('new-application', {
            userId: oppInfo.createdById,
            volunteerName,
            opportunityTitle: oppInfo.title,
            opportunityId,
          });
          return;
        } catch (err) {
          logger.warn('Failed to enqueue app notification, trying direct', {
            error: (err as Error).message,
          });
        }
      }

      const creator = await prisma.user.findUnique({
        where: { id: oppInfo.createdById },
        select: { email: true },
      });
      if (creator?.email) {
        await sendEmail(
          creator.email,
          'New Application from ' + volunteerName,
          `<h2>New Application</h2><p>${volunteerName} applied to "${oppInfo.title}".</p>`,
          `${volunteerName} applied to "${oppInfo.title}".`
        ).catch((err) =>
          logger.warn('Failed to send direct notification email', { error: (err as Error).message })
        );
      }
    };

    notify().catch((err) =>
      logger.warn('Failed to notify opportunity creator', { error: (err as Error).message })
    );
  }

  return application;
}

export async function listMyApplications(volunteerId: string, pagination?: PaginationParams) {
  if (!pagination) {
    return prisma.application.findMany({
      where: { volunteerId },
      select: {
        id: true,
        opportunityId: true,
        status: true,
        appliedAt: true,
        opportunity: { select: { title: true, category: true } },
      },
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
      select: {
        id: true,
        opportunityId: true,
        status: true,
        appliedAt: true,
        opportunity: { select: { title: true, category: true } },
      },
      orderBy: { appliedAt: 'desc' },
    }),
    prisma.application.count({ where: { volunteerId } }),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function listApplications(
  opportunityId: string,
  callerId: string,
  callerRole: string,
  callerOrgId: string | null | undefined,
  pagination: { page: number; limit: number }
) {
  const opportunity = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
  if (!opportunity) {
    throw new AppError('Opportunity not found', 404);
  }

  const isSysAdmin = hasSystemRole(callerRole);
  const isOwner = opportunity.createdById === callerId;
  const isSameOrg =
    opportunity.organizationId && callerOrgId && opportunity.organizationId === callerOrgId;

  if (!isSysAdmin && !isOwner && !isSameOrg) {
    throw new AppError('Forbidden', 403);
  }

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
  const updated = await prisma.application.update({
    where: { id: applicationId },
    data: { status: 'WITHDRAWN' },
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
  callerRole: string,
  callerOrgId: string | null | undefined
) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { opportunity: true },
  });

  if (!application) {
    throw new AppError('Application not found', 404);
  }

  const isSysAdmin = hasSystemRole(callerRole);
  const isOwner = application.opportunity.createdById === callerId;
  const isSameOrg =
    application.opportunity.organizationId &&
    callerOrgId &&
    application.opportunity.organizationId === callerOrgId;

  if (!isSysAdmin && !isOwner && !isSameOrg) {
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
      if (status === 'ACCEPTED') {
        try {
          await onApplicationAccepted(application.volunteerId, application.opportunityId, tx);
        } catch (err) {
          logger.warn('Failed to award application points/badges', {
            error: (err as Error).message,
          });
        }
      }
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
    .catch((err) =>
      logger.warn('Failed to enqueue application status notification', {
        error: (err as Error).message,
      })
    );

  await invalidateListCache();

  return updated;
}
