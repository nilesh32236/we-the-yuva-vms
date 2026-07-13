import type { NotificationPreferenceType } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../../middleware/error.middleware';
import * as service from './preferences.service';

const NotificationTypeParamSchema = z.enum([
  'APPLICATION_ACCEPTED',
  'EVENT_REMINDER',
  'PROMOTION',
  'NEW_APPLICATION',
  'MENTORSHIP',
  'TRAINING',
  'LEVEL_UP',
  'BADGE_EARNED',
  'CERTIFICATE_ISSUED',
  'ATTENDANCE_CONFIRMED',
  'FEEDBACK_REMINDER',
  'STORY_PUBLISHED',
  'WEEKLY_DIGEST',
  'SYSTEM_ANNOUNCEMENT',
  'PROFILE_REMINDER',
]);

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
    const parsedType = NotificationTypeParamSchema.parse(req.params.type);
    const result = await service.updatePreference(
      req.user!.id,
      parsedType as NotificationPreferenceType,
      req.body
    );
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError('Invalid notification type', 400));
    }
    next(err);
  }
}
