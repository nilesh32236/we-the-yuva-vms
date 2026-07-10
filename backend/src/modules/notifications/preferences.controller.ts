import type { NotificationPreferenceType } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import * as service from './preferences.service';

export async function getPreferencesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.getPreferences(req.user!.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function updatePreferenceHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.updatePreference(
      req.user!.id,
      req.params.type as NotificationPreferenceType,
      req.body
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
