import { type IRouter, Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { Permissions } from '../../shared/permissions';
import {
  coordinatorStatsHandler,
  observerStatsHandler,
  volunteerImpactHandler,
  volunteerStatsHandler,
} from './stats.controller';

export const statsRouter: IRouter = Router();

/**
 * @openapi
 * /stats/volunteer:
 *   get:
 *     tags: [Stats]
 *     summary: Get volunteer dashboard stats
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Volunteer stats
 */
statsRouter.get(
  '/volunteer',
  requireAuth,
  requirePermission(Permissions.STATS_VIEW_OWN),
  validate(z.object({})),
  volunteerStatsHandler
);

/**
 * @openapi
 * /stats/volunteer/impact:
 *   get:
 *     tags: [Stats]
 *     summary: Get volunteer impact page data
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Volunteer impact data
 */
statsRouter.get(
  '/volunteer/impact',
  requireAuth,
  requirePermission(Permissions.STATS_VIEW_OWN),
  validate(z.object({})),
  volunteerImpactHandler
);

/**
 * @openapi
 * /stats/coordinator:
 *   get:
 *     tags: [Stats]
 *     summary: Get coordinator dashboard stats
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Coordinator stats
 */
statsRouter.get(
  '/coordinator',
  requireAuth,
  requirePermission(Permissions.STATS_VIEW_OWN),
  validate(z.object({})),
  coordinatorStatsHandler
);

/**
 * @openapi
 * /stats/observer:
 *   get:
 *     tags: [Stats]
 *     summary: Get observer/admin dashboard stats
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Observer stats
 */
statsRouter.get(
  '/observer',
  requireAuth,
  requirePermission(Permissions.STATS_VIEW_OBSERVER),
  validate(z.object({})),
  observerStatsHandler
);
