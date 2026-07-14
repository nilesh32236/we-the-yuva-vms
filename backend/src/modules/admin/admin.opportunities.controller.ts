import type { NextFunction, Request, Response } from 'express';
import * as opportunitiesService from './admin.opportunities.service';

export async function adminListOpportunitiesHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit as string, 10) || 20));
    const search = req.query.search as string | undefined;

    const result = await opportunitiesService.listOpportunities(page, limit, search);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function adminGetOpportunityHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const [opportunity, applicationStats] = await Promise.all([
      opportunitiesService.getOpportunity(req.params.id),
      opportunitiesService.getApplicationStats(req.params.id),
    ]);

    if (!opportunity) {
      res.status(404).json({ error: 'Opportunity not found' });
      return;
    }

    res.status(200).json({ ...opportunity, applicationStats });
  } catch (err) {
    next(err);
  }
}
