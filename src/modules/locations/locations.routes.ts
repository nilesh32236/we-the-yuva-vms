import { type IRouter, Router } from 'express';
import { listLocationsHandler } from './locations.controller';

export const locationsRouter: IRouter = Router();

locationsRouter.get('/', listLocationsHandler);
