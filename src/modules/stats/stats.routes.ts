import { type IRouter, Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
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
statsRouter.get('/volunteer', requireAuth, requireRole('VOLUNTEER'), volunteerStatsHandler);

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
statsRouter.get('/volunteer/impact', requireAuth, requireRole('VOLUNTEER'), volunteerImpactHandler);

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
statsRouter.get('/coordinator', requireAuth, requireRole('COORDINATOR'), coordinatorStatsHandler);

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
statsRouter.get('/observer', requireAuth, requireRole('OBSERVER', 'ADMIN'), observerStatsHandler);
