import { type IRouter, Router } from 'express';
import { CreateBlogPostSchema, UpdateBlogPostSchema } from '@/shared';
import { requireAuth } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { Permissions } from '../../shared/permissions';
import {
  archiveHandler,
  createHandler,
  deleteHandler,
  getByIdHandler,
  getPublishedBySlugHandler,
  listAllHandler,
  listPublishedHandler,
  publishHandler,
  updateHandler,
} from './blog.controller';

export const blogRouter: IRouter = Router();

// Admin-only routes
blogRouter.get(
  '/all',
  requireAuth,
  requireRole('ADMIN'),
  requirePermission(Permissions.BLOG_VIEW_ALL),
  listAllHandler
);

// Public slug route must be before admin `/:id` to avoid Express matching slugs as IDs
blogRouter.get('/:slug', getPublishedBySlugHandler);
blogRouter.get('/:id', requireAuth, requireRole('ADMIN'), getByIdHandler);
blogRouter.post(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  requirePermission(Permissions.BLOG_CREATE),
  validate(CreateBlogPostSchema),
  createHandler
);
blogRouter.put(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  requirePermission(Permissions.BLOG_EDIT),
  validate(UpdateBlogPostSchema),
  updateHandler
);
blogRouter.delete(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  requirePermission(Permissions.BLOG_DELETE),
  deleteHandler
);
blogRouter.patch(
  '/:id/publish',
  requireAuth,
  requireRole('ADMIN'),
  requirePermission(Permissions.BLOG_PUBLISH),
  publishHandler
);
blogRouter.patch(
  '/:id/archive',
  requireAuth,
  requireRole('ADMIN'),
  requirePermission(Permissions.BLOG_EDIT),
  archiveHandler
);

// Public
blogRouter.get('/', listPublishedHandler);
