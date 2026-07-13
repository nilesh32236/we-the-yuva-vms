// Phase 2 (future): Outside MVP Phase 1 scope. Keep for Phase 2 implementation.
// See /issues/PHASE2_SCOPE.md
import { type IRouter, Router } from 'express';
import { AlertSubscriptionSchema, AlertSubscriptionUpdateSchema } from '@/shared';
import { requireAuth } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { Permissions } from '../../shared/permissions';
import {
  createSubscriptionHandler,
  deleteSubscriptionHandler,
  getMySubscriptionsHandler,
  updateSubscriptionHandler,
} from './alerts.controller';

export const alertsRouter: IRouter = Router();

/**
 * @openapi
 * /alerts:
 *   get:
 *     tags: [Alerts]
 *     summary: Get my alert subscriptions
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of alert subscriptions
 */
alertsRouter.get('/', requireAuth, requirePermission(Permissions.ALERT_MANAGE), getMySubscriptionsHandler);

/**
 * @openapi
 * /alerts:
 *   post:
 *     tags: [Alerts]
 *     summary: Create an alert subscription
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Alert subscription created
 */
alertsRouter.post(
  '/',
  requireAuth,
  requirePermission(Permissions.ALERT_MANAGE),
  validate(AlertSubscriptionSchema),
  createSubscriptionHandler
);

/**
 * @openapi
 * /alerts/{id}:
 *   put:
 *     tags: [Alerts]
 *     summary: Update an alert subscription
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Alert subscription ID
 *     responses:
 *       200:
 *         description: Alert subscription updated
 */
alertsRouter.put(
  '/:id',
  requireAuth,
  requirePermission(Permissions.ALERT_MANAGE),
  validate(AlertSubscriptionUpdateSchema),
  updateSubscriptionHandler
);

/**
 * @openapi
 * /alerts/{id}:
 *   delete:
 *     tags: [Alerts]
 *     summary: Delete an alert subscription
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Alert subscription ID
 *     responses:
 *       204:
 *         description: Alert subscription deleted
 */
alertsRouter.delete(
  '/:id',
  requireAuth,
  requirePermission(Permissions.ALERT_MANAGE),
  deleteSubscriptionHandler
);
