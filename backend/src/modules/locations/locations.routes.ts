import { type IRouter, Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { z } from 'zod';
import { Permissions } from '../../shared/permissions';
import { createLocationHandler, listLocationsHandler } from './locations.controller';

const CreateLocationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  district: z.string().optional(),
  state: z.string().optional(),
});

export const locationsRouter: IRouter = Router();

locationsRouter.get('/', requireAuth, listLocationsHandler);
locationsRouter.post(
  '/',
  requireAuth,
  requirePermission(Permissions.ORG_MANAGE),
  validate(CreateLocationSchema),
  createLocationHandler
);
