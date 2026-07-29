import sanitizeHtml from 'sanitize-html';
import slugify from 'slugify';
import { logAudit } from '../../lib/audit';
import { prisma } from '../../lib/prisma';
import { hasSystemRole } from '../../shared/helpers';
import { AppError } from '../../middleware/error.middleware';

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    'img', 'figure', 'figcaption', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'span', 'div', 'br', 'hr', 'pre', 'code', 'blockquote', 'p', 'ul', 'ol', 'li',
    'a', 'strong', 'em', 'u', 's', 'sub', 'sup',
  ]),
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    '*': ['class', 'id', 'style'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  disallowedTagsMode: 'discard',
};

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
  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const slug = await generateUniqueSlug(data.title);
    try {
      const sanitizedContent = sanitizeHtml(data.content, SANITIZE_OPTIONS);
      const post = await prisma.blogPost.create({
        data: { ...data, content: sanitizedContent, slug, authorId, tags: data.tags ?? [] },
      });
      await logAudit({
        userId: authorId,
        action: 'BLOG_CREATE',
        targetId: post.id,
        targetType: 'BlogPost',
      });
      return post;
    } catch (err: unknown) {
      if ((err as { code?: string })?.code !== 'P2002' || attempt === maxRetries - 1) {
        throw err;
      }
    }
  }
  throw new AppError('Failed to create post after retries', 500);
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
    where: { id, status: 'PUBLISHED' },
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
  const post = await prisma.blogPost.findUnique({
    where: { id },
    select: { id: true, authorId: true },
  });
  if (!post) throw new AppError('Post not found', 404);
  if (post.authorId !== userId && !hasSystemRole(callerRole)) throw new AppError('Forbidden', 403);

  const updateData: Record<string, unknown> = {
    ...data,
    ...(data.content ? { content: sanitizeHtml(data.content, SANITIZE_OPTIONS) } : {}),
  };
  if (data.title) {
    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      updateData.slug = await generateUniqueSlug(data.title);
      try {
        const updated = await prisma.blogPost.update({ where: { id }, data: updateData });
        await logAudit({ userId, action: 'BLOG_UPDATE', targetId: id, targetType: 'BlogPost' });
        return updated;
      } catch (err: unknown) {
        if ((err as { code?: string })?.code !== 'P2002' || attempt === maxRetries - 1) {
          throw err;
        }
      }
    }
  }

  const updated = await prisma.blogPost.update({ where: { id }, data: updateData });
  await logAudit({ userId, action: 'BLOG_UPDATE', targetId: id, targetType: 'BlogPost' });
  return updated;
}

export async function publishPost(id: string, userId: string, callerRole: string) {
  if (!hasSystemRole(callerRole)) throw new AppError('Forbidden: only admins can publish', 403);
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
  if (!hasSystemRole(callerRole)) throw new AppError('Forbidden: only admins can archive', 403);
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) throw new AppError('Post not found', 404);
  const updated = await prisma.blogPost.update({ where: { id }, data: { status: 'ARCHIVED' } });
  await logAudit({ userId, action: 'BLOG_ARCHIVE', targetId: id, targetType: 'BlogPost' });
  return updated;
}

export async function deletePost(id: string, userId: string, callerRole: string) {
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) throw new AppError('Post not found', 404);
  if (post.authorId !== userId && !hasSystemRole(callerRole)) throw new AppError('Forbidden', 403);
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
      include: { author: { select: { name: true } } },
    }),
    prisma.blogPost.count(),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
