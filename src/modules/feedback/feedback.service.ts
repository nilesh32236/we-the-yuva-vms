import { prisma } from '../../lib/prisma';
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
  if (!attendance) throw new AppError('You have not attended this event', 403);

  if (data.rating < 1 || data.rating > 5) throw new AppError('Rating must be between 1 and 5', 400);
  if (
    data.confidenceLevel !== undefined &&
    (data.confidenceLevel < 1 || data.confidenceLevel > 5)
  ) {
    throw new AppError('Confidence level must be between 1 and 5', 400);
  }

  return prisma.eventFeedback.upsert({
    where: { eventId_volunteerId: { eventId, volunteerId } },
    create: { eventId, volunteerId, ...data },
    update: {
      rating: data.rating,
      comments: data.comments,
      learnings: data.learnings,
      confidenceLevel: data.confidenceLevel,
    },
  });
}

export async function getMyFeedback(volunteerId: string) {
  return prisma.eventFeedback.findMany({
    where: { volunteerId },
    orderBy: { createdAt: 'desc' },
    include: { event: { select: { title: true, eventDate: true } } },
  });
}

export async function getEventFeedback(eventId: string) {
  return prisma.eventFeedback.findMany({
    where: { eventId },
    include: { volunteer: { select: { name: true } } },
  });
}

export async function getEventFeedbackSummary(eventId: string) {
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
