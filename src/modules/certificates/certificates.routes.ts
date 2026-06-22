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

const router: RouterType = Router();

router.get('/', requireAuth, requirePermission(Permissions.CERTIFICATE_VIEW), listCertificatesHandler);
router.get('/:id', requireAuth, requirePermission(Permissions.CERTIFICATE_VIEW), getCertificateHandler);
router.get('/:id/view', requireAuth, requirePermission(Permissions.CERTIFICATE_VIEW), viewCertificateHandler);
router.get('/verify/:hash', verifyCertificateHandler);

export { router as certificatesRouter };
