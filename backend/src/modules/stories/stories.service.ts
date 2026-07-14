import { logAudit } from '../../lib/audit';
import { logger } from '../../lib/logger';
import { prisma } from '../../lib/prisma';
import { notificationsQueue } from '../../lib/queue';
import { AppError } from '../../middleware/error.middleware';

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  '#39': "'",
  apos: "'",
  nbsp: '\u00A0',
  copy: '\u00A9',
  reg: '\u00AE',
  trade: '\u2122',
  mdash: '\u2014',
  ndash: '\u2013',
  hellip: '\u2026',
  laquo: '\u00AB',
  raquo: '\u00BB',
  ldquo: '\u201C',
  rdquo: '\u201D',
  lsquo: '\u2018',
  rsquo: '\u2019',
};

function decodeEntities(value: string): string {
  let prev: string;
  let result = value;
  do {
    prev = result;
    result = result
      .replace(/&#x([\da-f]+);/gi, (_, h: string) => String.fromCodePoint(Number.parseInt(h, 16)))
      .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
      .replace(/&([a-zA-Z#][a-zA-Z0-9]+);/g, (_, name: string) =>
        name in NAMED_ENTITIES ? NAMED_ENTITIES[name] : _
      );
  } while (result !== prev);
  return result;
}

function stripHtml(value: string): string {
  const decoded = decodeEntities(value);
  return decoded
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/[<>\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .trim();
}

export async function createStory(
  userId: string,
  data: { title: string; content: string; mediaUrl?: string }
) {
  const story = await prisma.story.create({
    data: { ...data, title: stripHtml(data.title), content: stripHtml(data.content), userId },
  });
  await logAudit({ userId, action: 'STORY_CREATE', targetId: story.id, targetType: 'Story' });
  return story;
}

export async function getPublishedStories(page = 1, limit = 20, userId?: string) {
  const skip = (page - 1) * limit;
  const where = userId ? { published: true, userId } : { published: true };
  const [data, total] = await Promise.all([
    prisma.story.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: { user: { select: { name: true } } },
    }),
    prisma.story.count({ where }),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getStoryById(id: string) {
  const story = await prisma.story.findUnique({
    where: { id, published: true },
    include: { user: { select: { name: true } } },
  });
  if (!story) throw new AppError('Story not found', 404);
  return story;
}

export async function updateStory(
  id: string,
  userId: string,
  data: { title?: string; content?: string; mediaUrl?: string },
  callerRole?: string
) {
  const story = await prisma.story.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });
  if (!story) throw new AppError('Story not found', 404);
  if (story.userId !== userId && callerRole !== 'ADMIN') throw new AppError('Forbidden', 403);
  const updated = await prisma.story.update({
    where: { id },
    data: {
      ...data,
      title: data.title ? stripHtml(data.title) : undefined,
      content: data.content ? stripHtml(data.content) : undefined,
    },
  });
  await logAudit({ userId, action: 'STORY_UPDATE', targetId: id, targetType: 'Story' });
  return updated;
}

export async function deleteStory(id: string, userId: string, callerRole: string) {
  const story = await prisma.story.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });
  if (!story) throw new AppError('Story not found', 404);
  if (story.userId !== userId && callerRole !== 'ADMIN') throw new AppError('Forbidden', 403);
  await prisma.story.delete({ where: { id } });
  await logAudit({ userId, action: 'STORY_DELETE', targetId: id, targetType: 'Story' });
}

export async function moderateStory(
  id: string,
  adminId: string,
  callerRole: string,
  published: boolean
) {
  if (callerRole !== 'ADMIN')
    throw new AppError('Forbidden: only admins can moderate stories', 403);
  const story = await prisma.story.findUnique({
    where: { id },
    select: { id: true, userId: true, title: true },
  });
  if (!story) throw new AppError('Story not found', 404);
  const updated = await prisma.story.update({ where: { id }, data: { published } });
  await logAudit({
    userId: adminId,
    action: published ? 'STORY_PUBLISH' : 'STORY_UNPUBLISH',
    targetId: id,
    targetType: 'Story',
    metadata: { published: String(published) },
  });
  if (published && notificationsQueue) {
    await notificationsQueue
      .add('story-published', {
        userId: story.userId,
        storyId: story.id,
        storyTitle: story.title,
      })
      .catch((err) =>
        logger.error('Failed to enqueue story-published notification', {
          error: (err as Error).message,
          storyId: story.id,
        })
      );
  }
  return updated;
}

export async function getAdminStoryById(id: string) {
  const story = await prisma.story.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
    },
  });
  if (!story) throw new AppError('Story not found', 404);
  return story;
}

export async function listAllStories(page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.story.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.story.count(),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
