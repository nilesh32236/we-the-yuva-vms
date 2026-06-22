import type { NextFunction, Request, Response } from 'express';
import { getLeaderboard } from './leaderboard.service';

export async function getLeaderboardHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { scope, timeframe, sortBy, locationId } = req.query;
    const result = await getLeaderboard({
      scope: scope as 'global' | 'location' | undefined,
      timeframe: timeframe as 'weekly' | 'monthly' | 'alltime' | undefined,
      sortBy: sortBy as 'points' | 'hours' | undefined,
      locationId: locationId as string | undefined,
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
