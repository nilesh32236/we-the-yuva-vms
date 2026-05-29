import type { NextFunction, Request, Response } from 'express';
import { getRecommendedOpportunities } from './matching.service';
import {
  applyToOpportunity,
  closeOpportunity,
  createOpportunity,
  getOpportunityById,
  listApplications,
  listMyApplications,
  listOpportunities,
  updateApplicationStatus,
  updateOpportunity,
  withdrawApplication,
} from './opportunities.service';

// ─── Opportunity Handlers ─────────────────────────────────────────

export async function createOpportunityHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const opportunity = await createOpportunity(req.user!.id, req.body);
    res.status(201).json(opportunity);
  } catch (err) {
    next(err);
  }
}

export async function listOpportunitiesHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

    const filters = {
      category: req.query.category as string | undefined,
      skills: req.query.skills
        ? (req.query.skills as string)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined,
      isRemote: req.query.isRemote !== undefined ? req.query.isRemote === 'true' : undefined,
      locationId: req.query.locationId as string | undefined,
      search: req.query.search as string | undefined,
    };

    const result = await listOpportunities(filters, { page, limit });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function recommendedHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const opportunities = await getRecommendedOpportunities(req.user!.id);
    res.status(200).json(opportunities);
  } catch (err) {
    next(err);
  }
}

export async function getOpportunityHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const opportunity = await getOpportunityById(req.params.id);
    res.status(200).json(opportunity);
  } catch (err) {
    next(err);
  }
}

export async function updateOpportunityHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const opportunity = await updateOpportunity(
      req.params.id,
      req.user!.id,
      req.user!.role,
      req.body
    );
    res.status(200).json(opportunity);
  } catch (err) {
    next(err);
  }
}

export async function closeOpportunityHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const closed = await closeOpportunity(req.params.id, req.user!.id, req.user!.role);
    res.status(200).json(closed);
  } catch (err) {
    next(err);
  }
}

// ─── Application Handlers ─────────────────────────────────────────

export async function applyHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const application = await applyToOpportunity(req.params.id, req.user!.id);
    res.status(201).json(application);
  } catch (err) {
    next(err);
  }
}

export async function listApplicationsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const applications = await listApplications(req.params.id, { page, limit });
    res.status(200).json(applications);
  } catch (err) {
    next(err);
  }
}

export async function updateApplicationStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const application = await updateApplicationStatus(
      req.params.appId,
      req.body.status,
      req.user!.id,
      req.user!.role
    );
    res.status(200).json(application);
  } catch (err) {
    next(err);
  }
}

export async function withdrawApplicationHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await withdrawApplication(req.params.id, req.user!.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function listMyApplicationsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const applications = await listMyApplications(req.user!.id);
    res.status(200).json(applications);
  } catch (err) {
    next(err);
  }
}
