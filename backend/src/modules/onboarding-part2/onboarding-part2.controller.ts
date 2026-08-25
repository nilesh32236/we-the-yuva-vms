import type { NextFunction, Request, Response } from 'express';
import { getPart2, upsertPart2 } from './onboarding-part2.service';

export async function getPart2Handler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await getPart2(req.user!.id, req.user!.role);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function putPart2Handler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await upsertPart2(req.user!.id, req.user!.role, req.body);
    res.json(data);
  } catch (err) {
    next(err);
  }
}
