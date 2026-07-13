import { type IRouter, Router } from 'express';
import { z } from 'zod';
import { RegisterOrganizationSchema, OrganizationDocumentSchema } from '@/shared';
import { requireAuth } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { Permissions } from '../../shared/permissions';
import {
  addCoordinatorHandler,
  getDocumentsHandler,
  getOrgHandler,
  getPublicOrgHandler,
  listCoordinatorsHandler,
  registerOrgHandler,
  removeCoordinatorHandler,
  updateOrgHandler,
  uploadDocumentHandler,
} from './organizations.controller';

const UpdateOrganizationSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(2000).optional(),
  address: z.string().max(500).optional(),
  phone: z.string().min(10).max(15).optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  isVerified: z.boolean().optional(),
});

const CoordinatorInviteSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address'),
});

export const organizationsRouter: IRouter = Router();

organizationsRouter.get('/public/:slug', getPublicOrgHandler);

organizationsRouter.post(
  '/register',
  requireAuth,
  requirePermission(Permissions.ORG_CREATE),
  validate(RegisterOrganizationSchema),
  registerOrgHandler
);

organizationsRouter.get('/:id', requireAuth, getOrgHandler);

organizationsRouter.patch(
  '/:id',
  requireAuth,
  requirePermission(Permissions.ORG_MANAGE),
  validate(UpdateOrganizationSchema),
  updateOrgHandler
);

organizationsRouter.post(
  '/:id/documents',
  requireAuth,
  requirePermission(Permissions.ORG_MANAGE),
  validate(OrganizationDocumentSchema),
  uploadDocumentHandler
);

organizationsRouter.get(
  '/:id/documents',
  requireAuth,
  requirePermission(Permissions.ORG_VERIFY),
  getDocumentsHandler
);

organizationsRouter.post(
  '/:id/coordinators',
  requireAuth,
  requirePermission(Permissions.COORDINATOR_MANAGE),
  validate(CoordinatorInviteSchema),
  addCoordinatorHandler
);

organizationsRouter.get(
  '/:id/coordinators',
  requireAuth,
  requirePermission(Permissions.COORDINATOR_MANAGE),
  listCoordinatorsHandler
);

organizationsRouter.delete(
  '/:id/coordinators/:userId',
  requireAuth,
  requirePermission(Permissions.COORDINATOR_MANAGE),
  removeCoordinatorHandler
);
