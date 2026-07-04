import { onFeedbackSubmitted } from '../badges/badge-engine.service';
import { hasSystemRole } from '../../shared/helpers';
import { logger } from '../../lib/logger';
import { prisma } from '../../lib/prisma';
import { notificationsQueue } from '../../lib/queue';
import { AppError } from '../../middleware/error.middleware';

export async function submitFeedback(
  eventId: string,
  volunteerId: string,
  data: { rating: number; comments?: string; learnings?: string; confidenceLevel?: number }
) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new AppError('Event not found', 404);

  const attendance = await prisma.attendance.findUnique({
    where: { eventId_volunteerId: { eventId, volunteerId } },
  });
  if (!attendance?.attended) throw new AppError('You have not attended this event', 403);

  if (data.rating < 1 || data.rating > 5) throw new AppError('Rating must be between 1 and 5', 400);
  if (
    data.confidenceLevel !== undefined &&
    (data.confidenceLevel < 1 || data.confidenceLevel > 5)
  ) {
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

export async function getEventFeedback(
  eventId: string,
  callerId: string,
  callerRole: string,
  callerOrgId: string | null | undefined,
  pagination?: { page: number; limit: number }
) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { opportunity: true },
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

  if (!pagination) {
    return prisma.eventFeedback.findMany({
      where: { eventId },
      include: { volunteer: { select: { name: true } } },
    });
  }
  const { page, limit } = pagination;
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
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { opportunity: true },
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

  const feedback = await prisma.eventFeedback.findMany({ where: { eventId } });
  if (feedback.length === 0) return { average: 0, count: 0, distribution: {} };
  const total = feedback.reduce((s, f) => s + f.rating, 0);
  const distribution: Record<number, number> = {};
  for (let i = 1; i <= 5; i++) distribution[i] = 0;
  for (const f of feedback) distribution[f.rating]++;
  return {
    average: Math.round((total / feedback.length) * 10) / 10,
    count: feedback.length,
    distribution,
  };
}
