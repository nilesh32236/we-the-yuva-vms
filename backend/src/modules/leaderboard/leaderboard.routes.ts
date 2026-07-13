import { Router } from 'express';
import { z } from 'zod';
import { getLeaderboardHandler } from './leaderboard.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { Permissions } from '../../shared/permissions';

const LeaderboardQuerySchema = z.object({
  scope: z.enum(['global', 'location']).optional(),
  timeframe: z.enum(['weekly', 'monthly', 'alltime']).optional(),
  sortBy: z.enum(['points', 'hours']).optional(),
  locationId: z.string().min(1).optional(),
});

export const leaderboardRouter: Router = Router();
leaderboardRouter.get('/', requireAuth, requirePermission(Permissions.LEVEL_VIEW), validate(LeaderboardQuerySchema), getLeaderboardHandler);
