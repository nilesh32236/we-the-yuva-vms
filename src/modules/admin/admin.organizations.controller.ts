import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../middleware/error.middleware';
import { getAdminOrgStats } from '../stats/stats.service';
import {
  getOrganizationDocuments,
  listOrganizations,
  suspendOrganization,
  verifyOrganization,
} from '../organizations/organizations.service';

export async function adminListOrgsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit as string, 10) || 20));
    const status = req.query.status as string | undefined;

    const result = await listOrganizations({ status, page, limit });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function adminVerifyOrgHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { approved } = req.body;

    if (typeof approved !== 'boolean') {
      throw new AppError('approved must be a boolean', 400);
    }

    const org = await verifyOrganization(id, approved);
    res.status(200).json(org);
  } catch (err) {
    next(err);
  }
}

export async function adminSuspendOrgHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const org = await suspendOrganization(req.params.id);
    res.status(200).json(org);
  } catch (err) {
    next(err);
  }
}

export async function adminOrgStatsHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await getAdminOrgStats();
    res.status(200).json(stats);
  } catch (err) {
    next(err);
  }
}

export async function adminGetOrgDocumentsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const docs = await getOrganizationDocuments(req.params.id);
    res.status(200).json(docs);
  } catch (err) {
    next(err);
  }
}
