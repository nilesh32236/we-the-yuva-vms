import { type IRouter, Router } from 'express';
import {
  NotificationPreferenceSchema,
  PushSubscriptionSchema,
  PushUnsubscribeSchema,
} from '@/shared';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  deleteNotificationHandler,
  getNotificationHandler,
  listNotificationsHandler,
  markAllReadHandler,
  markReadHandler,
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
notificationsRouter.get('/', requireAuth, listNotificationsHandler);

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
 * /notifications/preferences:
 *   get:
 *     tags: [Notifications]
 *     summary: Get notification preferences
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Notification preferences
 */
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
