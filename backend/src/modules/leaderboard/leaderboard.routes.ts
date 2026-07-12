import { Router } from 'express';
import { getLeaderboardHandler } from './leaderboard.controller';
import { requireAuth } from '../../middleware/auth.middleware';

export const leaderboardRouter: Router = Router();
leaderboardRouter.get('/', requireAuth, getLeaderboardHandler);
