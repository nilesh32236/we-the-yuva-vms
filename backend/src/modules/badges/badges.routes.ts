import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { Permissions } from '../../shared/permissions';
import { listBadgesHandler, getMyBadgesHandler } from './badges.controller';

export const badgesRouter: Router = Router();
badgesRouter.get('/', listBadgesHandler);
badgesRouter.get('/me', requireAuth, requirePermission(Permissions.LEVEL_VIEW), getMyBadgesHandler);
