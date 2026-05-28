import { type IRouter, Router } from 'express';
import { CompleteLessonSchema, GetCourseSchema } from '@/shared';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { completeLessonHandler, getCourseHandler, listCoursesHandler } from './training.controller';

export const trainingRouter: IRouter = Router();

/**
 * @openapi
 * /training:
 *   get:
 *     tags: [Training]
 *     summary: List all training courses
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of courses
 */
trainingRouter.get('/', requireAuth, listCoursesHandler);

/**
 * @openapi
 * /training/{id}:
 *   get:
 *     tags: [Training]
 *     summary: Get a training course by ID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course details
 */
trainingRouter.get('/:id', requireAuth, validate(GetCourseSchema), getCourseHandler);

/**
 * @openapi
 * /training/{id}/lessons/{lessonId}/complete:
 *   post:
 *     tags: [Training]
 *     summary: Mark a lesson as completed
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *         description: Lesson ID
 *     responses:
 *       200:
 *         description: Lesson marked as complete
 */
trainingRouter.post(
  '/:id/lessons/:lessonId/complete',
  requireAuth,
  validate(CompleteLessonSchema),
  completeLessonHandler
);
