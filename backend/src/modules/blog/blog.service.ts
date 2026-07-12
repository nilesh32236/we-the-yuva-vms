import slugify from 'slugify';
import { logAudit } from '../../lib/audit';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/error.middleware';

async function generateUniqueSlug(title: string): Promise<string> {
  const base = slugify(title, { lower: true, strict: true });

  const existingSlugs = await prisma.blogPost.findMany({
    where: { slug: { startsWith: base } },
    select: { slug: true },
  });
  const slugSet = new Set(existingSlugs.map((p) => p.slug));

  if (!slugSet.has(base)) return base;

  let counter = 1;
  while (slugSet.has(`${base}-${counter}`)) {
    counter++;
  }
  return `${base}-${counter}`;
}

export async function createPost(
  authorId: string,
  data: {
    title: string;
    excerpt?: string;
    content: string;
    featuredImage?: string;
    tags?: string[];
    category?: string;
  }
) {
  const slug = await generateUniqueSlug(data.title);
  const post = await prisma.blogPost.create({
    data: { ...data, slug, authorId, tags: data.tags ?? [] },
  });
  await logAudit({
    userId: authorId,
    action: 'BLOG_CREATE',
    targetId: post.id,
    targetType: 'BlogPost',
  });
  return post;
}

export async function getPublishedPosts(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.blogPost.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      skip,
      take: limit,
      include: { author: { select: { name: true } } },
    }),
    prisma.blogPost.count({ where: { status: 'PUBLISHED' } }),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getPostBySlug(slug: string) {
  const post = await prisma.blogPost.findUnique({
    where: { slug, status: 'PUBLISHED' },
    include: { author: { select: { name: true } } },
  });
  if (!post) throw new AppError('Post not found', 404);
  return post;
}

export async function getPostById(id: string) {
  const post = await prisma.blogPost.findUnique({
    where: { id },
    include: { author: { select: { name: true } } },
  });
  if (!post) throw new AppError('Post not found', 404);
  return post;
}

export async function updatePost(
  id: string,
  userId: string,
  data: {
    title?: string;
    excerpt?: string;
    content?: string;
    featuredImage?: string;
    tags?: string[];
    category?: string;
  },
  callerRole: string
) {
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) throw new AppError('Post not found', 404);
  if (post.authorId !== userId && callerRole !== 'ADMIN') throw new AppError('Forbidden', 403);

  const updateData: Record<string, unknown> = { ...data };
  if (data.title) {
    updateData.slug = await generateUniqueSlug(data.title);
  }

  const updated = await prisma.blogPost.update({ where: { id }, data: updateData });
  await logAudit({ userId, action: 'BLOG_UPDATE', targetId: id, targetType: 'BlogPost' });
  return updated;
}

export async function publishPost(id: string, userId: string, callerRole: string) {
  if (callerRole !== 'ADMIN') throw new AppError('Forbidden: only admins can publish', 403);
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) throw new AppError('Post not found', 404);
  const updated = await prisma.blogPost.update({
    where: { id },
    data: { status: 'PUBLISHED', publishedAt: new Date() },
  });
  await logAudit({ userId, action: 'BLOG_PUBLISH', targetId: id, targetType: 'BlogPost' });
  return updated;
}

export async function archivePost(id: string, userId: string, callerRole: string) {
  if (callerRole !== 'ADMIN') throw new AppError('Forbidden: only admins can archive', 403);
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) throw new AppError('Post not found', 404);
  const updated = await prisma.blogPost.update({ where: { id }, data: { status: 'ARCHIVED' } });
  await logAudit({ userId, action: 'BLOG_ARCHIVE', targetId: id, targetType: 'BlogPost' });
  return updated;
}

export async function deletePost(id: string, userId: string, callerRole: string) {
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) throw new AppError('Post not found', 404);
  if (post.authorId !== userId && callerRole !== 'ADMIN') throw new AppError('Forbidden', 403);
  await prisma.blogPost.delete({ where: { id } });
  await logAudit({ userId, action: 'BLOG_DELETE', targetId: id, targetType: 'BlogPost' });
}

export async function listAllPosts(page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.blogPost.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: { author: { select: { name: true, email: true } } },
    }),
    prisma.blogPost.count(),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
