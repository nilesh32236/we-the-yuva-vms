import { type IRouter, Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { Permissions } from '../../shared/permissions';
import { uploadFileHandler } from './upload.controller';
import { upload } from './upload.service';

export const uploadRouter: IRouter = Router();

/**
 * @openapi
 * /upload:
 *   post:
 *     tags: [Upload]
 *     summary: Upload a file
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: File uploaded
 */
uploadRouter.post(
  '/',
  requireAuth,
  requirePermission(Permissions.FILE_UPLOAD),
  upload.single('file'),
  uploadFileHandler
);
