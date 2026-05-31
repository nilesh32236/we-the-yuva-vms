import { type IRouter, Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { Permissions } from '../../shared/permissions';
import {
  addCoordinatorHandler,
  listCoordinatorsHandler,
  removeCoordinatorHandler,
} from './coordinators.controller';
import {
  getDocumentsHandler,
  getOrgHandler,
  registerOrgHandler,
  updateOrgHandler,
  uploadDocumentHandler,
} from './organizations.controller';

export const organizationsRouter: IRouter = Router();

organizationsRouter.post(
  '/register',
  requireAuth,
  requirePermission(Permissions.ORG_CREATE),
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
