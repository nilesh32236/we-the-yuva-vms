import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { Permissions } from '../../shared/permissions';
import { listBadgesHandler, getMyBadgesHandler, listPendingApprovalsHandler, approveBadgeHandler, rejectBadgeHandler } from './badges.controller';

const BadgeReviewSchema = z.object({
  reviewNote: z.string().max(500).optional(),
});

export const badgesRouter: Router = Router();
badgesRouter.get('/', listBadgesHandler);
badgesRouter.get('/me', requireAuth, requirePermission(Permissions.LEVEL_VIEW), getMyBadgesHandler);
badgesRouter.get('/pending', requireAuth, requirePermission(Permissions.BADGE_APPROVE), listPendingApprovalsHandler);
badgesRouter.post('/:userId/:badgeId/approve', requireAuth, requirePermission(Permissions.BADGE_APPROVE), validate(BadgeReviewSchema), approveBadgeHandler);
badgesRouter.post('/:userId/:badgeId/reject', requireAuth, requirePermission(Permissions.BADGE_APPROVE), validate(BadgeReviewSchema), rejectBadgeHandler);
