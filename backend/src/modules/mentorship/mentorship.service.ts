import { checkAndAwardBadges } from '../badges/badge-engine.service';
import { logger } from '../../lib/logger';
import { prisma } from '../../lib/prisma';
import { notificationsQueue } from '../../lib/queue';
import { AppError } from '../../middleware/error.middleware';

export async function requestMentorship(mentorId: string, menteeId: string) {
  if (mentorId === menteeId) {
    throw new AppError('You cannot request mentorship with yourself', 400);
  }

  const [mentor, mentee] = await Promise.all([
    prisma.user.findUnique({ where: { id: mentorId } }),
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

  const mentorship = await prisma.mentorship.create({
    data: { mentorId, menteeId, status: 'PENDING' },
    include: {
      mentor: { select: { id: true, name: true } },
      mentee: { select: { id: true, name: true } },
    },
  });

  if (notificationsQueue) {
    notificationsQueue
      .add('mentorship-update', {
        userId: menteeId,
        title: 'New Mentorship Request',
        body: `${mentorship.mentor.name} wants you as their mentee`,
        link: '/volunteer/mentorship',
      })
      .catch((err) =>
        logger.warn('Failed to enqueue mentorship notification', { error: (err as Error).message })
      );
  }

  return mentorship;
}

export async function listPendingRequests(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.mentorship.findMany({
      where: { mentorId: userId, status: 'PENDING' },
      skip,
      take: limit,
      include: {
        mentee: {
          select: { id: true, name: true, email: true, profile: true },
        },
      },
      orderBy: { startedAt: 'desc' },
    }),
    prisma.mentorship.count({ where: { mentorId: userId, status: 'PENDING' } }),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function listMyRequests(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.mentorship.findMany({
      where: { menteeId: userId },
      skip,
      take: limit,
      include: {
        mentor: { select: { id: true, name: true, email: true } },
      },
      orderBy: { startedAt: 'desc' },
    }),
    prisma.mentorship.count({ where: { menteeId: userId } }),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
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

  if (status === 'ACTIVE' && notificationsQueue) {
    notificationsQueue
      .add('mentorship-update', {
        userId: result.menteeId,
        title: 'Mentorship Approved',
        body: `${result.mentor.name} has accepted your mentorship request!`,
        link: '/volunteer/mentorship',
      })
      .catch((err) =>
        logger.warn('Failed to enqueue mentorship notification', { error: (err as Error).message })
      );
  }

  return result;
}

export async function listMyMentors(menteeId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.mentorship.findMany({
      where: { menteeId, status: { in: ['ACTIVE', 'COMPLETED'] } },
      skip,
      take: limit,
      include: {
        mentor: { select: { id: true, name: true, email: true, profile: true } },
      },
      orderBy: { startedAt: 'desc' },
    }),
    prisma.mentorship.count({ where: { menteeId, status: { in: ['ACTIVE', 'COMPLETED'] } } }),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function listMyMentees(mentorId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.mentorship.findMany({
      where: { mentorId, status: { in: ['ACTIVE', 'COMPLETED'] } },
      skip,
      take: limit,
      include: {
        mentee: { select: { id: true, name: true, email: true, profile: true } },
      },
      orderBy: { startedAt: 'desc' },
    }),
    prisma.mentorship.count({ where: { mentorId, status: { in: ['ACTIVE', 'COMPLETED'] } } }),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
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

  if (notificationsQueue) {
    notificationsQueue
      .add('mentorship-update', {
        userId: result.menteeId,
        title: 'Mentorship Completed',
        body: `Your mentorship with ${result.mentor.name} has been completed!`,
        link: '/volunteer/mentorship',
      })
      .catch((err) =>
        logger.warn('Failed to enqueue mentorship notification', { error: (err as Error).message })
      );
    notificationsQueue
      .add('mentorship-update', {
        userId: result.mentorId,
        title: 'Mentorship Completed',
        body: `Your mentorship with ${result.mentee.name} has been completed. Great job mentoring!`,
        link: '/coordinator/mentorship',
      })
      .catch((err) =>
        logger.warn('Failed to enqueue mentorship notification', { error: (err as Error).message })
      );
  }

  return result;
}

export async function cancelMentorshipRequest(requestId: string, userId: string) {
  const mentorship = await prisma.mentorship.findUnique({ where: { id: requestId } });
  if (!mentorship) throw new AppError('Mentorship request not found', 404);
  if (mentorship.menteeId !== userId)
    throw new AppError('Only the mentee can cancel a request', 403);
  if (mentorship.status !== 'PENDING') throw new AppError('Can only cancel pending requests', 400);

  await prisma.mentorship.update({ where: { id: requestId }, data: { status: 'CANCELLED' } });
}
