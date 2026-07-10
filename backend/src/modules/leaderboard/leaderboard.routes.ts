import { Router } from 'express';
import { getLeaderboardHandler } from './leaderboard.controller';

export const leaderboardRouter: Router = Router();
leaderboardRouter.get('/', getLeaderboardHandler);
