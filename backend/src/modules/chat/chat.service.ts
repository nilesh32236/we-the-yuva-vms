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
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
      include: {
        user: { select: { id: true, name: true } },
      },
    }),
    prisma.chatMessage.count({ where: { room: { opportunityId } } }),
  ]);

  return { data, total, page, limit };
}

export async function sendMessage(opportunityId: string, userId: string, content: string) {
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
