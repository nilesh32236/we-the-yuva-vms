import { type IRouter, Router } from 'express';
import { CreateBlogPostSchema, UpdateBlogPostSchema } from '@/shared';
import { requireAuth } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';

import { validate } from '../../middleware/validate.middleware';
import { Permissions } from '../../shared/permissions';
import {
  archiveHandler,
  createHandler,
  deleteHandler,
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
  requirePermission(Permissions.BLOG_VIEW_ALL),
  listAllHandler
);

// Single param route handles both slug and ID lookups
blogRouter.get('/:param', getPublishedBySlugHandler);
blogRouter.post(
  '/',
  requireAuth,
  requirePermission(Permissions.BLOG_CREATE),
  validate(CreateBlogPostSchema),
  createHandler
);
blogRouter.put(
  '/:id',
  requireAuth,
  requirePermission(Permissions.BLOG_EDIT),
  validate(UpdateBlogPostSchema),
  updateHandler
);
blogRouter.delete(
  '/:id',
  requireAuth,
  requirePermission(Permissions.BLOG_DELETE),
  deleteHandler
);
blogRouter.patch(
  '/:id/publish',
  requireAuth,
  requirePermission(Permissions.BLOG_PUBLISH),
  publishHandler
);
blogRouter.patch(
  '/:id/archive',
  requireAuth,
  requirePermission(Permissions.BLOG_EDIT),
  archiveHandler
);

// Public
blogRouter.get('/', listPublishedHandler);
