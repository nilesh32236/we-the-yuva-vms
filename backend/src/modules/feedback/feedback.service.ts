import { onFeedbackSubmitted } from '../badges/badge-engine.service';
import { hasSystemRole } from '../../shared/helpers';
import { logger } from '../../lib/logger';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/error.middleware';

export async function submitFeedback(
  eventId: string,
  volunteerId: string,
  data: { rating: number; comments?: string; learnings?: string; confidenceLevel?: number }
) {
  const [event, attendance] = await Promise.all([
    prisma.event.findUnique({ where: { id: eventId } }),
    prisma.attendance.findUnique({
      where: { eventId_volunteerId: { eventId, volunteerId } },
    }),
  ]);

  if (!event) throw new AppError('Event not found', 404);
  if (!attendance?.attended) throw new AppError('You have not attended this event', 403);

  if (data.rating < 1 || data.rating > 5) throw new AppError('Rating must be between 1 and 5', 400);
  if (data.confidenceLevel !== undefined && (data.confidenceLevel < 1 || data.confidenceLevel > 5)) {
    throw new AppError('Confidence level must be between 1 and 5', 400);
  }

  const existing = await prisma.eventFeedback.findUnique({
    where: { eventId_volunteerId: { eventId, volunteerId } },
  });
  if (existing) {
    throw new AppError('You have already submitted feedback for this event', 409);
  }

  const result = await prisma.eventFeedback.create({
    data: { eventId, volunteerId, ...data },
  });

  try {
    await onFeedbackSubmitted(volunteerId, eventId);
  } catch (err) {
    logger.warn('Failed to award badge/points on feedback submission', {
      err,
      userId: volunteerId,
      eventId,
    });
  }

  return result;
}

export async function getMyFeedback(
  volunteerId: string,
  pagination: { page: number; limit: number }
) {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;
  const where = { volunteerId };
  const [data, total] = await Promise.all([
    prisma.eventFeedback.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { event: { select: { title: true, eventDate: true } } },
    }),
    prisma.eventFeedback.count({ where }),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

async function assertEventAccess(
  eventId: string,
  callerId: string,
  callerRole: string,
  callerOrgId: string | null | undefined
) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, opportunity: { select: { createdById: true, organizationId: true } } },
  });

  if (!event) throw new AppError('Event not found', 404);

  const isSysAdmin = hasSystemRole(callerRole);
  const isOwner = event.opportunity.createdById === callerId;
  const isSameOrg =
    event.opportunity.organizationId &&
    callerOrgId &&
    event.opportunity.organizationId === callerOrgId;

  if (!isSysAdmin && !isOwner && !isSameOrg) {
    throw new AppError('Forbidden', 403);
  }
}

export async function getEventFeedback(
  eventId: string,
  callerId: string,
  callerRole: string,
  callerOrgId: string | null | undefined,
  pagination?: { page: number; limit: number }
) {
  await assertEventAccess(eventId, callerId, callerRole, callerOrgId);

  const page = pagination?.page ?? 1;
  const limit = pagination?.limit ?? 100;
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.eventFeedback.findMany({
      where: { eventId },
      skip,
      take: limit,
      include: { volunteer: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.eventFeedback.count({ where: { eventId } }),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function updateFeedback(
  eventId: string,
  volunteerId: string,
  data: { rating?: number; comments?: string; learnings?: string; confidenceLevel?: number }
) {
  if (data.rating !== undefined && (data.rating < 1 || data.rating > 5)) {
    throw new AppError('Rating must be between 1 and 5', 400);
  }
  if (data.confidenceLevel !== undefined && (data.confidenceLevel < 1 || data.confidenceLevel > 5)) {
    throw new AppError('Confidence level must be between 1 and 5', 400);
  }
  const existing = await prisma.eventFeedback.findUnique({
    where: { eventId_volunteerId: { eventId, volunteerId } },
  });
  if (!existing) throw new AppError('Feedback not found', 404);
  return prisma.eventFeedback.update({
    where: { eventId_volunteerId: { eventId, volunteerId } },
    data,
  });
}

export async function deleteFeedback(eventId: string, volunteerId: string) {
  const existing = await prisma.eventFeedback.findUnique({
    where: { eventId_volunteerId: { eventId, volunteerId } },
  });
  if (!existing) throw new AppError('Feedback not found', 404);
  return prisma.eventFeedback.delete({
    where: { eventId_volunteerId: { eventId, volunteerId } },
  });
}

export async function getEventFeedbackSummary(
  eventId: string,
  callerId: string,
  callerRole: string,
  callerOrgId: string | null | undefined
) {
  await assertEventAccess(eventId, callerId, callerRole, callerOrgId);

  const [aggregate, distribution] = await Promise.all([
    prisma.eventFeedback.aggregate({
      where: { eventId },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.eventFeedback.groupBy({
      by: ['rating'],
      where: { eventId },
      _count: true,
    }),
  ]);

  const dist: Record<number, number> = {};
  for (let i = 1; i <= 5; i++) dist[i] = 0;
  for (const d of distribution) dist[d.rating] = (dist[d.rating] ?? 0) + d._count;

  return {
    average: aggregate._avg.rating ? Math.round(aggregate._avg.rating * 10) / 10 : 0,
    count: aggregate._count,
    distribution: dist,
  };
}
