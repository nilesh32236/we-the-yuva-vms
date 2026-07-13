import { type IRouter, Router } from 'express';
import { InitialAssessmentSchema, ReflectionSchema } from '@/shared';
import { requireAuth } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { Permissions } from '../../shared/permissions';
import {
  getYouthProfileHandler,
  submitInitialAssessmentHandler,
  submitReflectionHandler,
} from './youth-profiles.controller';

export const youthProfilesRouter: IRouter = Router();

// Self-service endpoints — requireAuth is sufficient since users manage their own profiles
youthProfilesRouter.get('/me', requireAuth, getYouthProfileHandler);

youthProfilesRouter.post(
  '/me/initial',
  requireAuth,
  requirePermission(Permissions.YOUTH_PROFILE_MANAGE),
  validate(InitialAssessmentSchema),
  submitInitialAssessmentHandler
);

youthProfilesRouter.post(
  '/me/reflect',
  requireAuth,
  requirePermission(Permissions.YOUTH_PROFILE_MANAGE),
  validate(ReflectionSchema),
  submitReflectionHandler
);
