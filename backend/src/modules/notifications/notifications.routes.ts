import { type IRouter, Router } from 'express';
import { z } from 'zod';
import {
  NotificationPreferenceSchema,
  PushSubscriptionSchema,
  PushUnsubscribeSchema,
} from '@/shared';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';

const TestPushSchema = z.object({
  title: z.string().max(100).optional(),
  body: z.string().max(500).optional(),
  link: z.string().max(500).optional(),
});

const ListNotificationsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
});
import {
  deleteNotificationHandler,
  getNotificationHandler,
  listNotificationsHandler,
  markAllReadHandler,
  markReadHandler,
  sendTestPushHandler,
  subscribeHandler,
  unreadCountHandler,
  unsubscribeHandler,
} from './notifications.controller';
import { getPreferencesHandler, updatePreferenceHandler } from './preferences.controller';

export const notificationsRouter: IRouter = Router();

/**
 * @openapi
 * /notifications/subscribe:
 *   post:
 *     tags: [Notifications]
 *     summary: Subscribe to push notifications
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Subscribed
 */
notificationsRouter.post(
  '/subscribe',
  requireAuth,
  validate(PushSubscriptionSchema),
  subscribeHandler
);

/**
 * @openapi
 * /notifications/unsubscribe:
 *   post:
 *     tags: [Notifications]
 *     summary: Unsubscribe from push notifications
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Unsubscribed
 */
notificationsRouter.post(
  '/unsubscribe',
  requireAuth,
  validate(PushUnsubscribeSchema),
  unsubscribeHandler
);

/**
 * @openapi
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: List notifications for current user
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of notifications
 */
notificationsRouter.get('/', requireAuth, validate(ListNotificationsQuerySchema), listNotificationsHandler);

/**
 * @openapi
 * /notifications/unread-count:
 *   get:
 *     tags: [Notifications]
 *     summary: Get unread notification count
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Unread count
 */
notificationsRouter.get('/unread-count', requireAuth, unreadCountHandler);

/**
 * @openapi
 * /notifications/preferences:
 *   get:
 *     tags: [Notifications]
 *     summary: Get notification preferences
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Notification preferences
 */
// Register preference routes first (before :id catch-all)
notificationsRouter.get('/preferences', requireAuth, getPreferencesHandler);

/**
 * @openapi
 * /notifications/preferences/{type}:
 *   put:
 *     tags: [Notifications]
 *     summary: Update notification preference for a type
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification type
 *     responses:
 *       200:
 *         description: Preference updated
 */
notificationsRouter.put(
  '/preferences/:type',
  requireAuth,
  validate(NotificationPreferenceSchema),
  updatePreferenceHandler
);

/**
 * @openapi
 * /notifications/test-push:
 *   post:
 *     tags: [Notifications]
 *     summary: Send a test push notification to yourself
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Test push sent
 */
notificationsRouter.post('/test-push', requireAuth, validate(TestPushSchema), sendTestPushHandler);

// IMPORTANT: /read-all must be registered BEFORE /:id routes to avoid Express capturing "read-all" as an :id
/**
 * @openapi
 * /notifications/read-all:
 *   post:
 *     tags: [Notifications]
 *     summary: Mark all notifications as read
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
notificationsRouter.post('/read-all', requireAuth, markAllReadHandler);

/**
 * @openapi
 * /notifications/{id}/read:
 *   post:
 *     tags: [Notifications]
 *     summary: Mark a notification as read
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
notificationsRouter.post('/:id/read', requireAuth, markReadHandler);

/**
 * @openapi
 * /notifications/{id}:
 *   get:
 *     tags: [Notifications]
 *     summary: Get a single notification
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Notification details
 */
notificationsRouter.get('/:id', requireAuth, getNotificationHandler);

/**
 * @openapi
 * /notifications/{id}:
 *   delete:
 *     tags: [Notifications]
 *     summary: Delete a notification
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       204:
 *         description: Notification deleted
 */
notificationsRouter.delete('/:id', requireAuth, deleteNotificationHandler);
