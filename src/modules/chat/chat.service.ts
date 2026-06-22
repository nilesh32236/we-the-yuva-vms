import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/error.middleware';

export async function getOrCreateRoom(opportunityId: string) {
  return prisma.chatRoom.upsert({
    where: { opportunityId },
    create: { opportunityId },
    update: {},
  });
}

export async function getMessages(opportunityId: string, page = 1, limit = 50) {
  const room = await prisma.chatRoom.findUnique({ where: { opportunityId } });
  if (!room) return { data: [], total: 0, page, limit };

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.chatMessage.findMany({
      where: { roomId: room.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: { select: { id: true, name: true } },
      },
    }),
    prisma.chatMessage.count({ where: { roomId: room.id } }),
  ]);

  return { data: data.reverse(), total, page, limit };
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
