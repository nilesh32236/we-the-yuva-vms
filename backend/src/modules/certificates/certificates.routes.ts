import { type Router as RouterType, Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { Permissions } from '../../shared/permissions';
import {
  listCertificatesHandler,
  getCertificateHandler,
  viewCertificateHandler,
  verifyCertificateHandler,
} from './certificates.controller';

// This module is read-only: all routes are GET endpoints with no request body,
// so no Zod body schemas or validate() middleware are required.
// If a mutation endpoint (POST/PUT/PATCH) is added later, define a schema in
// shared/schemas/ and wire up the validate() middleware.
const router: RouterType = Router();

router.get(
  '/',
  requireAuth,
  requirePermission(Permissions.CERTIFICATE_VIEW),
  listCertificatesHandler
);
router.get(
  '/:id',
  requireAuth,
  requirePermission(Permissions.CERTIFICATE_VIEW),
  getCertificateHandler
);
router.get(
  '/:id/view',
  requireAuth,
  requirePermission(Permissions.CERTIFICATE_DOWNLOAD),
  viewCertificateHandler
);
router.get('/verify/:hash', verifyCertificateHandler);

export { router as certificatesRouter };
