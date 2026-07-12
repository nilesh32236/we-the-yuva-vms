import { type IRouter, Router } from 'express';
import { z } from 'zod';
import {
  OnboardingSchema,
  StaffProfileSchema,
  UpdateMeSchema,
  VOLUNTEER_TYPES,
  VolunteerProfileSchema,
} from '@/shared';
import { requireAuth } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { Permissions } from '../../shared/permissions';
import { getMyEventsHandler } from '../events/events.controller';
import {
  createStaffProfile,
  createVolunteerProfile,
  exportVolunteersHandler,
  getCoordinatorVolunteersHandler,
  getMeHandler,
  getProfileStatusHandler,
  getUserProfileHandler,
  submitOnboardingHandler,
  updateMeHandler,
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

usersRouter.get('/me/profile-status', requireAuth, getProfileStatusHandler);

/**
 * @openapi
 * /users/me:
 *   patch:
 *     tags: [Users]
 *     summary: Update current user's name/email
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: User updated
 */
usersRouter.patch('/me', requireAuth, validate(UpdateMeSchema), updateMeHandler);

const VolunteerTypeSchema = z.object({
  volunteerType: z.enum(VOLUNTEER_TYPES, {
    errorMap: () => ({ message: 'Please select a valid volunteer type' }),
  }),
});
usersRouter.patch(
  '/me/volunteer-type',
  requireAuth,
  requirePermission(Permissions.USER_PROFILE_MANAGE),
  validate(VolunteerTypeSchema),
  updateMeHandler
);

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
usersRouter.get('/me/events', requirePermission(Permissions.USER_EVENTS_VIEW), getMyEventsHandler);

usersRouter.post(
  '/me/profile',
  requirePermission(Permissions.USER_PROFILE_MANAGE),
  validate(VolunteerProfileSchema),
  createVolunteerProfile
);
usersRouter.put(
  '/me/profile',
  requirePermission(Permissions.USER_PROFILE_MANAGE),
  validate(VolunteerProfileSchema),
  updateVolunteerProfile
);

usersRouter.post(
  '/me/onboarding',
  requirePermission(Permissions.USER_PROFILE_MANAGE),
  validate(OnboardingSchema),
  submitOnboardingHandler
);

usersRouter.post(
  '/me/staff-profile',
  requirePermission(Permissions.USER_PROFILE_MANAGE),
  validate(StaffProfileSchema),
  createStaffProfile
);
usersRouter.put(
  '/me/staff-profile',
  requirePermission(Permissions.USER_PROFILE_MANAGE),
  validate(StaffProfileSchema),
  updateStaffProfile
);

usersRouter.get(
  '/coordinators/me/volunteers/export',
  requirePermission(Permissions.USER_VOLUNTEERS_MANAGE),
  exportVolunteersHandler
);
usersRouter.get(
  '/coordinators/me/volunteers',
  requirePermission(Permissions.USER_VOLUNTEERS_MANAGE),
  getCoordinatorVolunteersHandler
);

usersRouter.get(
  '/:id/profile',
  requirePermission(Permissions.USER_PROFILE_VIEW),
  getUserProfileHandler
);
