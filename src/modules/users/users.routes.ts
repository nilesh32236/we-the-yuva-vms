import { type IRouter, Router } from 'express';
import { StaffProfileSchema, VolunteerProfileSchema } from '@/shared';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { getMyEventsHandler } from '../events/events.controller';
import {
  createStaffProfile,
  createVolunteerProfile,
  exportVolunteersHandler,
  getCoordinatorVolunteersHandler,
  getMeHandler,
  getUserProfileHandler,
  updateStaffProfile,
  updateVolunteerProfile,
} from './users.controller';

export const usersRouter: IRouter = Router();

// All routes require authentication
usersRouter.use(requireAuth);

/**
 * @openapi
 * /users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get current user profile
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Current user profile retrieved
 */
usersRouter.get('/me', getMeHandler);

/**
 * @openapi
 * /users/me/events:
 *   get:
 *     tags: [Users]
 *     summary: Get volunteer's own events
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of my events
 */
usersRouter.get('/me/events', requireRole('VOLUNTEER'), getMyEventsHandler);

/**
 * @openapi
 * /users/me/profile:
 *   post:
 *     tags: [Users]
 *     summary: Create volunteer profile
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bio: { type: string }
 *               skills: { type: array, items: { type: string } }
 *     responses:
 *       201:
 *         description: Volunteer profile created
 */
usersRouter.post(
  '/me/profile',
  requireRole('VOLUNTEER'),
  validate(VolunteerProfileSchema),
  createVolunteerProfile
);
/**
 * @openapi
 * /users/me/profile:
 *   put:
 *     tags: [Users]
 *     summary: Update volunteer profile
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bio: { type: string }
 *               skills: { type: array, items: { type: string } }
 *     responses:
 *       200:
 *         description: Volunteer profile updated
 */
usersRouter.put(
  '/me/profile',
  requireRole('VOLUNTEER'),
  validate(VolunteerProfileSchema),
  updateVolunteerProfile
);

/**
 * @openapi
 * /users/me/staff-profile:
 *   post:
 *     tags: [Users]
 *     summary: Create staff profile (Coordinator/Admin/Observer)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               department: { type: string }
 *               designation: { type: string }
 *     responses:
 *       201:
 *         description: Staff profile created
 */
usersRouter.post(
  '/me/staff-profile',
  requireRole('COORDINATOR', 'ADMIN', 'OBSERVER'),
  validate(StaffProfileSchema),
  createStaffProfile
);
/**
 * @openapi
 * /users/me/staff-profile:
 *   put:
 *     tags: [Users]
 *     summary: Update staff profile (Coordinator/Admin/Observer)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               department: { type: string }
 *               designation: { type: string }
 *     responses:
 *       200:
 *         description: Staff profile updated
 */
usersRouter.put(
  '/me/staff-profile',
  requireRole('COORDINATOR', 'ADMIN', 'OBSERVER'),
  validate(StaffProfileSchema),
  updateStaffProfile
);

/**
 * @openapi
 * /users/coordinator/me/volunteers/export:
 *   get:
 *     tags: [Users]
 *     summary: Export coordinator's volunteers as CSV
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: CSV export of volunteers
 */
usersRouter.get(
  '/coordinators/me/volunteers/export',
  requireRole('COORDINATOR'),
  exportVolunteersHandler
);
/**
 * @openapi
 * /users/coordinator/me/volunteers:
 *   get:
 *     tags: [Users]
 *     summary: List coordinator's volunteers
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of volunteers
 */
usersRouter.get(
  '/coordinators/me/volunteers',
  requireRole('COORDINATOR'),
  getCoordinatorVolunteersHandler
);

/**
 * @openapi
 * /users/{id}/profile:
 *   get:
 *     tags: [Users]
 *     summary: View a volunteer's profile (Coordinator/Admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Volunteer user ID
 *     responses:
 *       200:
 *         description: Volunteer profile retrieved
 */
usersRouter.get('/:id/profile', requireRole('COORDINATOR', 'ADMIN'), getUserProfileHandler);
