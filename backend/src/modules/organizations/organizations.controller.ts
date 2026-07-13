import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../middleware/error.middleware';
import {
  addCoordinatorToOrg,
  addOrganizationDocument,
  getOrganization,
  getOrganizationDocuments,
  getPublicOrganizationBySlug,
  listCoordinators,
  registerOrganization,
  removeCoordinatorFromOrg,
  updateOrganization,
} from './organizations.service';

export async function registerOrgHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const org = await registerOrganization(userId, req.body);
    res.status(201).json(org);
  } catch (err) {
    next(err);
  }
}

export async function getOrgHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const org = await getOrganization(req.params.id);
    res.status(200).json(org);
  } catch (err) {
    next(err);
  }
}

export async function updateOrgHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const org = await updateOrganization(req.params.id, req.user!.id, req.body);
    res.status(200).json(org);
  } catch (err) {
    next(err);
  }
}

export async function uploadDocumentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { fileName, fileUrl, type } = req.body;

    const doc = await addOrganizationDocument(id, fileName, fileUrl, type);
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
}

export async function getDocumentsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const docs = await getOrganizationDocuments(req.params.id);
    res.status(200).json(docs);
  } catch (err) {
    next(err);
  }
}

export async function getPublicOrgHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const org = await getPublicOrganizationBySlug(req.params.slug);
    if (!org) {
      throw new AppError('Organization not found', 404);
    }
    res.status(200).json(org);
  } catch (err) {
    next(err);
  }
}

export async function addCoordinatorHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    if (!name || !email) {
      throw new AppError('name and email are required', 400);
    }

    const coordinator = await addCoordinatorToOrg(id, req.user!.id, { name, email });
    res.status(201).json(coordinator);
  } catch (err) {
    next(err);
  }
}

export async function listCoordinatorsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const coordinators = await listCoordinators(req.params.id);
    res.status(200).json(coordinators);
  } catch (err) {
    next(err);
  }
}

export async function removeCoordinatorHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id, userId } = req.params;
    await removeCoordinatorFromOrg(id, req.user!.id, userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
