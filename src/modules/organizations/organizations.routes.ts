import { type IRouter, Router } from 'express';
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
