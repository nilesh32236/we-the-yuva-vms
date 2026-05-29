import { type IRouter, Router } from 'express';
import { FeedbackSchema, UpdateFeedbackSchema } from '@/shared';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  deleteFeedbackHandler,
  getEventFeedbackHandler,
  getEventFeedbackSummaryHandler,
  getMyFeedbackHandler,
  submitFeedbackHandler,
  updateFeedbackHandler,
} from './feedback.controller';

export const feedbackRouter: IRouter = Router();

/**
 * @openapi
 * /feedback/events/{eventId}:
 *   post:
 *     tags: [Feedback]
 *     summary: Submit feedback for an event (Volunteer)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       201:
 *         description: Feedback submitted
 */
feedbackRouter.post(
  '/events/:eventId',
  requireAuth,
  requireRole('VOLUNTEER'),
  validate(FeedbackSchema),
  submitFeedbackHandler
);

/**
 * @openapi
 * /feedback/events/{eventId}:
 *   patch:
 *     tags: [Feedback]
 *     summary: Update own feedback (Volunteer)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Feedback updated
 */
feedbackRouter.patch(
  '/events/:eventId',
  requireAuth,
  requireRole('VOLUNTEER'),
  validate(UpdateFeedbackSchema),
  updateFeedbackHandler
);

/**
 * @openapi
 * /feedback/events/{eventId}:
 *   delete:
 *     tags: [Feedback]
 *     summary: Delete own feedback (Volunteer)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       204:
 *         description: Feedback deleted
 */
feedbackRouter.delete(
  '/events/:eventId',
  requireAuth,
  requireRole('VOLUNTEER'),
  deleteFeedbackHandler
);

/**
 * @openapi
 * /feedback/mine:
 *   get:
 *     tags: [Feedback]
 *     summary: List my feedback submissions (Volunteer)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of my feedback
 */
feedbackRouter.get('/mine', requireAuth, requireRole('VOLUNTEER'), getMyFeedbackHandler);

/**
 * @openapi
 * /feedback/events/{eventId}:
 *   get:
 *     tags: [Feedback]
 *     summary: Get feedback for an event
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: List of feedback
 */
feedbackRouter.get('/events/:eventId', requireAuth, requireRole('COORDINATOR', 'ADMIN'), getEventFeedbackHandler);

/**
 * @openapi
 * /feedback/events/{eventId}/summary:
 *   get:
 *     tags: [Feedback]
 *     summary: Get feedback summary for an event
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Feedback summary
 */
feedbackRouter.get('/events/:eventId/summary', requireAuth, getEventFeedbackSummaryHandler);
