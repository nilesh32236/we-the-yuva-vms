import { type IRouter, Router } from 'express';
import { AlertSubscriptionSchema, AlertSubscriptionUpdateSchema } from '@/shared';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
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
alertsRouter.get('/', requireAuth, getMySubscriptionsHandler);

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
alertsRouter.post('/', requireAuth, requireRole('VOLUNTEER', 'COORDINATOR', 'ADMIN'), validate(AlertSubscriptionSchema), createSubscriptionHandler);

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
  requireRole('VOLUNTEER', 'COORDINATOR', 'ADMIN'),
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
alertsRouter.delete('/:id', requireAuth, requireRole('VOLUNTEER', 'COORDINATOR', 'ADMIN'), deleteSubscriptionHandler);
