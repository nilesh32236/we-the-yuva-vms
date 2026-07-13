import { Router } from 'express';
import { z } from 'zod';
import { getLeaderboardHandler } from './leaderboard.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';

const LeaderboardQuerySchema = z.object({
  query: z.object({
    scope: z.enum(['global', 'location']).optional(),
    timeframe: z.enum(['weekly', 'monthly', 'alltime']).optional(),
    sortBy: z.enum(['points', 'hours']).optional(),
    locationId: z.string().optional(),
  }),
});

export const leaderboardRouter: Router = Router();
leaderboardRouter.get('/', requireAuth, validate(LeaderboardQuerySchema), getLeaderboardHandler);
