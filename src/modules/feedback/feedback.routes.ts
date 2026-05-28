import { type IRouter, Router } from 'express';
import { FeedbackSchema } from '@/shared';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  getEventFeedbackHandler,
  getEventFeedbackSummaryHandler,
  getMyFeedbackHandler,
  submitFeedbackHandler,
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
feedbackRouter.get('/events/:eventId', requireAuth, getEventFeedbackHandler);

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
