import type { NextFunction, Request, Response } from 'express';
import {
  listLevels,
  getLevel,
  getMyLevel,
  getMyProgress,
  getMyLevelRequests,
  createLevelRequest,
  cancelLevelRequest,
  reviewLevelRequest,
  listPendingRequests,
  getMyPoints,
  getMyPointsHistory,
} from './levels.service';

export async function listLevelsHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const levels = await listLevels();
    res.status(200).json(levels);
  } catch (err) {
    next(err);
  }
}

export async function getLevelHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const level = await getLevel(req.params.id);
    res.status(200).json(level);
  } catch (err) {
    next(err);
  }
}

export async function getMyLevelHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await getMyLevel(req.user!.id);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
}

export async function getMyProgressHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const progress = await getMyProgress(req.user!.id);
    res.status(200).json(progress);
  } catch (err) {
    next(err);
  }
}

export async function getMyLevelRequestsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requests = await getMyLevelRequests(req.user!.id);
    res.status(200).json(requests);
  } catch (err) {
    next(err);
  }
}

export async function createLevelRequestHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const request = await createLevelRequest(req.user!.id, req.params.levelId, req.body);
    res.status(201).json(request);
  } catch (err) {
    next(err);
  }
}

export async function cancelLevelRequestHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await cancelLevelRequest(req.params.id, req.user!.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function reviewLevelRequestHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await reviewLevelRequest(req.params.id, req.user!.id, req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function listPendingRequestsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const search = req.query.search as string | undefined;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await listPendingRequests(search, page, limit);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getMyPointsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const points = await getMyPoints(req.user!.id);
    res.status(200).json(points);
  } catch (err) {
    next(err);
  }
}

export async function getMyPointsHistoryHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const history = await getMyPointsHistory(req.user!.id);
    res.status(200).json(history);
  } catch (err) {
    next(err);
  }
}
