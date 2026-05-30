import { type IRouter, Router } from 'express';
import {
  CompleteLessonSchema,
  CreateCourseSchema,
  CreateLessonSchema,
  UpdateCourseSchema,
  UpdateLessonSchema,
} from '@/shared';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  completeLessonHandler,
  createCourseHandler,
  createLessonHandler,
  deleteCourseHandler,
  deleteLessonHandler,
  getCourseHandler,
  listCoursesHandler,
  updateCourseHandler,
  updateLessonHandler,
} from './training.controller';

export const trainingRouter: IRouter = Router();

/**
 * @openapi
 * /training:
 *   post:
 *     tags: [Training]
 *     summary: Create a course (Admin)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Course created
 */
trainingRouter.post(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  validate(CreateCourseSchema),
  createCourseHandler
);

/**
 * @openapi
 * /training/{id}:
 *   put:
 *     tags: [Training]
 *     summary: Update a course (Admin)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Course updated
 */
trainingRouter.put(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  validate(UpdateCourseSchema),
  updateCourseHandler
);

/**
 * @openapi
 * /training/{id}:
 *   delete:
 *     tags: [Training]
 *     summary: Delete a course (Admin)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       204:
 *         description: Course deleted
 */
trainingRouter.delete('/:id', requireAuth, requireRole('ADMIN'), deleteCourseHandler);

/**
 * @openapi
 * /training/{courseId}/lessons:
 *   post:
 *     tags: [Training]
 *     summary: Create a lesson (Admin)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Lesson created
 */
trainingRouter.post(
  '/:courseId/lessons',
  requireAuth,
  requireRole('ADMIN'),
  validate(CreateLessonSchema),
  createLessonHandler
);

/**
 * @openapi
 * /training/{courseId}/lessons/{id}:
 *   put:
 *     tags: [Training]
 *     summary: Update a lesson (Admin)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Lesson updated
 */
trainingRouter.put(
  '/:courseId/lessons/:id',
  requireAuth,
  requireRole('ADMIN'),
  validate(UpdateLessonSchema),
  updateLessonHandler
);

/**
 * @openapi
 * /training/{courseId}/lessons/{id}:
 *   delete:
 *     tags: [Training]
 *     summary: Delete a lesson (Admin)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       204:
 *         description: Lesson deleted
 */
trainingRouter.delete(
  '/:courseId/lessons/:id',
  requireAuth,
  requireRole('ADMIN'),
  deleteLessonHandler
);

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
trainingRouter.get('/:id', requireAuth, getCourseHandler);

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
  requireRole('VOLUNTEER'),
  validate(CompleteLessonSchema),
  completeLessonHandler
);
