import { AppError } from '../../middleware/error.middleware';
import { prisma } from '../../lib/prisma';

export async function getOrCreateRoom(opportunityId: string) {
  return prisma.chatRoom.upsert({
    where: { opportunityId },
    create: { opportunityId },
    update: {},
  });
}

export async function getMessages(opportunityId: string, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.chatMessage.findMany({
      where: { room: { opportunityId } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: { select: { id: true, name: true } },
      },
    }),
    prisma.chatMessage.count({ where: { room: { opportunityId } } }),
  ]);

  return { data: data.reverse(), total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function sendMessage(opportunityId: string, userId: string, content: string) {
  const opportunity = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    select: { id: true, createdById: true, organizationId: true },
  });
  if (!opportunity) throw new AppError('Opportunity not found', 404);

  const isCoordinator = opportunity.createdById === userId;
  const isAcceptedVolunteer = !isCoordinator && await prisma.application.findFirst({
    where: { opportunityId, volunteerId: userId, status: 'ACCEPTED' },
    select: { id: true },
  });
  if (!isCoordinator && !isAcceptedVolunteer) {
    throw new AppError('You are not authorized to send messages in this chat room', 403);
  }

  const room = await getOrCreateRoom(opportunityId);

  return prisma.chatMessage.create({
    data: {
      roomId: room.id,
      userId,
      content,
    },
    include: {
      user: { select: { id: true, name: true } },
    },
  });
}
