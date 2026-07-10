import { type IRouter, Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { z } from 'zod';
import { createLocationHandler, listLocationsHandler } from './locations.controller';

const CreateLocationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  district: z.string().optional(),
  state: z.string().optional(),
});

export const locationsRouter: IRouter = Router();

locationsRouter.get('/', listLocationsHandler);
locationsRouter.post('/', requireAuth, validate(CreateLocationSchema), createLocationHandler);
