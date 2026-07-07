import { type IRouter, Router } from 'express';
import { AdminCreateUserSchema, AdminUserUpdateSchema } from '@/shared';
import { requireAuth } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { Permissions } from '../../shared/permissions';
import {
  adminStatsHandler,
  createUserHandler,
  listUsersHandler,
  updateUserHandler,
} from './admin.controller';
import {
  adminGetOrgDocumentsHandler,
  adminGetOrgHandler,
  adminListOrgsHandler,
  adminOrgStatsHandler,
  adminSuspendOrgHandler,
  adminVerifyOrgHandler,
} from './admin.organizations.controller';
import { listRolesHandler } from './admin.roles.controller';

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
  requirePermission(Permissions.USER_MANAGE),
  validate(AdminCreateUserSchema),
  createUserHandler
);

adminRouter.get(
  '/users',
  requireAuth,
  requirePermission(Permissions.USER_MANAGE),
  listUsersHandler
);

adminRouter.get(
  '/stats',
  requireAuth,
  requirePermission(Permissions.USER_MANAGE),
  adminStatsHandler
);

adminRouter.patch(
  '/users/:id',
  requireAuth,
  requirePermission(Permissions.USER_MANAGE),
  validate(AdminUserUpdateSchema),
  updateUserHandler
);

adminRouter.get(
  '/organizations/stats',
  requireAuth,
  requirePermission(Permissions.ORG_VERIFY),
  adminOrgStatsHandler
);
adminRouter.get(
  '/organizations',
  requireAuth,
  requirePermission(Permissions.ORG_VERIFY),
  adminListOrgsHandler
);
adminRouter.patch(
  '/organizations/:id/verify',
  requireAuth,
  requirePermission(Permissions.ORG_VERIFY),
  adminVerifyOrgHandler
);
adminRouter.delete(
  '/organizations/:id',
  requireAuth,
  requirePermission(Permissions.ORG_MANAGE),
  adminSuspendOrgHandler
);
adminRouter.get(
  '/organizations/:id',
  requireAuth,
  requirePermission(Permissions.ORG_VERIFY),
  adminGetOrgHandler
);
adminRouter.get(
  '/organizations/:id/documents',
  requireAuth,
  requirePermission(Permissions.ORG_VERIFY),
  adminGetOrgDocumentsHandler
);

adminRouter.get(
  '/roles',
  requireAuth,
  requirePermission(Permissions.USER_MANAGE),
  listRolesHandler
);
