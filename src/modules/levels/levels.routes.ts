import { type IRouter, Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { Permissions } from '../../shared/permissions';
import { CreateLevelRequestSchema, ReviewLevelRequestSchema } from '../../shared/schemas/levels.schemas';
import {
  listLevelsHandler,
  getLevelHandler,
  getMyLevelHandler,
  getMyProgressHandler,
  getMyLevelRequestsHandler,
  createLevelRequestHandler,
  cancelLevelRequestHandler,
  reviewLevelRequestHandler,
  listPendingRequestsHandler,
  getMyPointsHandler,
  getMyPointsHistoryHandler,
} from './levels.controller';

export const levelsRouter: IRouter = Router();

levelsRouter.get('/', listLevelsHandler);
levelsRouter.get('/:id', getLevelHandler);
levelsRouter.get('/users/me/level', requireAuth, getMyLevelHandler);
levelsRouter.get('/users/me/level/progress', requireAuth, requirePermission(Permissions.LEVEL_VIEW), getMyProgressHandler);
levelsRouter.get('/users/me/level/requests', requireAuth, requirePermission(Permissions.LEVEL_VIEW), getMyLevelRequestsHandler);
levelsRouter.post('/:levelId/request', requireAuth, requirePermission(Permissions.LEVEL_REQUEST), validate(CreateLevelRequestSchema), createLevelRequestHandler);
levelsRouter.delete('/requests/:id', requireAuth, requirePermission(Permissions.LEVEL_REQUEST), cancelLevelRequestHandler);
levelsRouter.get('/users/me/points', requireAuth, requirePermission(Permissions.LEVEL_VIEW), getMyPointsHandler);
levelsRouter.get('/users/me/points/history', requireAuth, requirePermission(Permissions.LEVEL_VIEW), getMyPointsHistoryHandler);

levelsRouter.get('/admin/level-requests', requireAuth, requirePermission(Permissions.LEVEL_REVIEW), listPendingRequestsHandler);
levelsRouter.patch('/admin/level-requests/:id', requireAuth, requirePermission(Permissions.LEVEL_REVIEW), validate(ReviewLevelRequestSchema), reviewLevelRequestHandler);
