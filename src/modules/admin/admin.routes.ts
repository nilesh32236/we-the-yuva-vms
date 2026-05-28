import { type IRouter, Router } from 'express';
import { AdminCreateUserSchema, AdminUserUpdateSchema } from '@/shared';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  adminStatsHandler,
  createUserHandler,
  listUsersHandler,
  updateUserHandler,
} from './admin.controller';

export const adminRouter: IRouter = Router();

/**
 * @openapi
 * /admin/users:
 *   post:
 *     tags: [Admin]
 *     summary: Create a user directly (Admin only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: User created
 */
adminRouter.post(
  '/users',
  requireAuth,
  requireRole('ADMIN'),
  validate(AdminCreateUserSchema),
  createUserHandler
);

/**
 * @openapi
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List all users (Admin only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of users
 */
adminRouter.get('/users', requireAuth, requireRole('ADMIN'), listUsersHandler);

/**
 * @openapi
 * /admin/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Get admin dashboard stats
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Admin dashboard stats
 */
adminRouter.get('/stats', requireAuth, requireRole('ADMIN'), adminStatsHandler);

/**
 * @openapi
 * /admin/{id}:
 *   patch:
 *     tags: [Admin]
 *     summary: Update user status/role (Admin only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role: { type: string }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: User updated
 */
adminRouter.patch(
  '/users/:id',
  requireAuth,
  requireRole('ADMIN'),
  validate(AdminUserUpdateSchema),
  updateUserHandler
);
