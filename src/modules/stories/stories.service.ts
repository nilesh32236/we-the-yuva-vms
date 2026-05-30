import { logAudit } from '../../lib/audit';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/error.middleware';

function stripHtml(value: string): string {
  return (
    value
      // Decode HTML entities first
      .replace(/&#(\d+);/g, (_: string, dec: string) => String.fromCharCode(Number(dec)))
      .replace(/&#x([\da-f]+);/gi, (_: string, hex: string) =>
        String.fromCharCode(Number.parseInt(hex, 16))
      )
      // Remove script tags and their content entirely
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      // Remove HTML tags (only actual tags starting with < followed by a letter or /)
      .replace(/<\/?[a-z][\s\S]*?>/gi, '')
      // Strip javascript:/data:/vbscript: protocol handlers in attributes
      .replace(
        /\s+(?:href|src|action|formaction)\s*=\s*["']?\s*(?:javascript|data|vbscript):/gi,
        ' '
      )
      // Strip event handler attributes
      .replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, ' ')
      .replace(/\s+on\w+\s*=\s*\S+/gi, ' ')
      .trim()
  );
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

export async function getPublishedStories(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.story.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: { user: { select: { name: true } } },
    }),
    prisma.story.count({ where: { published: true } }),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getStoryById(id: string) {
  const story = await prisma.story.findUnique({
    where: { id },
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
  const story = await prisma.story.findUnique({ where: { id } });
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
  const story = await prisma.story.findUnique({ where: { id } });
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
  const story = await prisma.story.findUnique({ where: { id } });
  if (!story) throw new AppError('Story not found', 404);
  const updated = await prisma.story.update({ where: { id }, data: { published } });
  await logAudit({
    userId: adminId,
    action: published ? 'STORY_PUBLISH' : 'STORY_UNPUBLISH',
    targetId: id,
    targetType: 'Story',
    metadata: { published: String(published) },
  });
  return updated;
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
