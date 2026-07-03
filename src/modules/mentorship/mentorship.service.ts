import { checkAndAwardBadges } from '../badges/badge-engine.service';
import { logger } from '../../lib/logger';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/error.middleware';

export async function requestMentorship(mentorId: string, menteeId: string, _message?: string) {
  if (mentorId === menteeId) {
    throw new AppError('You cannot request mentorship with yourself', 400);
  }

  const [mentor, mentee] = await Promise.all([
    prisma.user.findUnique({ where: { id: mentorId }, include: { roleRef: true } }),
    prisma.user.findUnique({ where: { id: menteeId } }),
  ]);

  if (!mentor) throw new AppError('Mentor not found', 404);
  if (!mentee) throw new AppError('Mentee not found', 404);

  const existing = await prisma.mentorship.findFirst({
    where: {
      mentorId,
      menteeId,
      status: { in: ['PENDING', 'ACTIVE'] },
    },
  });

  if (existing) {
    throw new AppError('A mentorship request already exists between these users', 409);
  }

  return prisma.mentorship.create({
    data: { mentorId, menteeId, status: 'PENDING' },
    include: {
      mentor: { select: { id: true, name: true } },
      mentee: { select: { id: true, name: true } },
    },
  });
}

export async function listPendingRequests(userId: string) {
  return prisma.mentorship.findMany({
    where: { mentorId: userId, status: 'PENDING' },
    include: {
      mentee: {
        select: { id: true, name: true, email: true, profile: true },
      },
    },
    orderBy: { startedAt: 'desc' },
  });
}

export async function listMyRequests(userId: string) {
  return prisma.mentorship.findMany({
    where: { menteeId: userId },
    include: {
      mentor: { select: { id: true, name: true, email: true } },
    },
    orderBy: { startedAt: 'desc' },
  });
}

export async function reviewMentorshipRequest(
  requestId: string,
  mentorId: string,
  status: 'ACTIVE' | 'COMPLETED'
) {
  const mentorship = await prisma.mentorship.findUnique({ where: { id: requestId } });
  if (!mentorship) throw new AppError('Mentorship request not found', 404);
  if (mentorship.mentorId !== mentorId)
    throw new AppError('Not authorized to review this request', 403);
  if (mentorship.status !== 'PENDING') throw new AppError('Request is not pending', 400);

  const result = await prisma.mentorship.update({
    where: { id: requestId },
    data: { status },
    include: {
      mentor: { select: { id: true, name: true } },
      mentee: { select: { id: true, name: true } },
    },
  });

  try {
    await checkAndAwardBadges(mentorId);
  } catch (err) {
    logger.warn('Failed to award badge on mentorship update', { err, mentorshipId: requestId });
  }

  return result;
}

export async function listMyMentors(menteeId: string) {
  return prisma.mentorship.findMany({
    where: { menteeId, status: { in: ['ACTIVE', 'COMPLETED'] } },
    include: {
      mentor: { select: { id: true, name: true, email: true, profile: true } },
    },
    orderBy: { startedAt: 'desc' },
  });
}

export async function listMyMentees(mentorId: string) {
  return prisma.mentorship.findMany({
    where: { mentorId, status: { in: ['ACTIVE', 'COMPLETED'] } },
    include: {
      mentee: { select: { id: true, name: true, email: true, profile: true } },
    },
    orderBy: { startedAt: 'desc' },
  });
}

export async function completeMentorship(requestId: string, userId: string) {
  const mentorship = await prisma.mentorship.findUnique({ where: { id: requestId } });
  if (!mentorship) throw new AppError('Mentorship not found', 404);
  if (mentorship.mentorId !== userId && mentorship.menteeId !== userId) {
    throw new AppError('Not authorized to complete this mentorship', 403);
  }

  const result = await prisma.mentorship.update({
    where: { id: requestId },
    data: { status: 'COMPLETED', endedAt: new Date() },
    include: {
      mentor: { select: { id: true, name: true } },
      mentee: { select: { id: true, name: true } },
    },
  });

  try {
    await checkAndAwardBadges(mentorship.mentorId);
  } catch (err) {
    logger.warn('Failed to award badge on mentorship update', { err, mentorshipId: requestId });
  }

  return result;
}

export async function cancelMentorshipRequest(requestId: string, userId: string) {
  const mentorship = await prisma.mentorship.findUnique({ where: { id: requestId } });
  if (!mentorship) throw new AppError('Mentorship request not found', 404);
  if (mentorship.menteeId !== userId)
    throw new AppError('Only the mentee can cancel a request', 403);
  if (mentorship.status !== 'PENDING') throw new AppError('Can only cancel pending requests', 400);

  await prisma.mentorship.delete({ where: { id: requestId } });
}
