import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { Permissions } from '../../shared/permissions';
import { listBadgesHandler, getMyBadgesHandler, listPendingApprovalsHandler, approveBadgeHandler, rejectBadgeHandler } from './badges.controller';

export const badgesRouter: Router = Router();
badgesRouter.get('/', listBadgesHandler);
badgesRouter.get('/me', requireAuth, requirePermission(Permissions.LEVEL_VIEW), getMyBadgesHandler);
badgesRouter.get('/pending', requireAuth, requirePermission(Permissions.BADGE_APPROVE), listPendingApprovalsHandler);
badgesRouter.post('/:userId/:badgeId/approve', requireAuth, requirePermission(Permissions.BADGE_APPROVE), approveBadgeHandler);
badgesRouter.post('/:userId/:badgeId/reject', requireAuth, requirePermission(Permissions.BADGE_APPROVE), rejectBadgeHandler);
