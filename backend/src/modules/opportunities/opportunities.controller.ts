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
    const opportunity = await createOpportunity(req.user!.id, req.user!.organizationId, req.body);
    res.status(201).json(opportunity);
  } catch (err) {
    next(err);
  }
}

export async function listPublicOpportunitiesHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit as string, 10) || 20));

    const result = await listOpportunities({}, { page, limit });
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
    res.status(200).json(result);
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
    const page = Math.max(1, Number.parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit as string, 10) || 20));

    const filters = {
      category: req.query.category as string | undefined,
      skills: (() => {
        const raw = req.query.skills;
        const skillsStr = Array.isArray(raw) ? String(raw) : (raw as string);
        return skillsStr
          ? skillsStr
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined;
      })(),
      isRemote: req.query.isRemote !== undefined ? req.query.isRemote === 'true' : undefined,
      locationId: req.query.locationId as string | undefined,
      search: req.query.search as string | undefined,
      organizationId: req.query.organizationId as string | undefined,
    };

    const result = await listOpportunities(filters, { page, limit }, req.user!.id);
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

export async function getPublicOpportunityHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const opportunity = await getOpportunityById(req.params.id);
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
    res.status(200).json(opportunity);
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
    res.setHeader('Cache-Control', 'private, max-age=300');
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
      req.user!.organizationId,
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
    await closeOpportunity(req.params.id, req.user!.id, req.user!.role, req.user!.organizationId);
    res.status(204).send();
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
    const page = Math.max(1, Number.parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit as string, 10) || 20));
    const applications = await listApplications(
      req.params.id,
      req.user!.id,
      req.user!.role,
      req.user!.organizationId,
      { page, limit }
    );
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
      req.user!.role,
      req.user!.organizationId
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
    const page = req.query.page
      ? Math.max(1, Number.parseInt(req.query.page as string, 10) || 1)
      : undefined;
    const limit = page
      ? Math.min(100, Math.max(1, Number.parseInt(req.query.limit as string, 10) || 20))
      : undefined;
    const pagination = page ? { page, limit: limit! } : undefined;
    const applications = await listMyApplications(req.user!.id, pagination);
    res.status(200).json(pagination ? applications : { data: applications });
  } catch (err) {
    next(err);
  }
}
