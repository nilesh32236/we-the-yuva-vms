import fs from 'node:fs';
import path from 'node:path';
import { type IRouter, Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { Permissions } from '../../shared/permissions';
import { hasSystemRole } from '../../shared/helpers';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { uploadFileHandler } from './upload.controller';
import { PRIVATE_UPLOADS_DIR, getS3Client, isS3Enabled, upload } from './upload.service';

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

/**
 * @openapi
 * /upload/private/{filename}:
 *   get:
 *     tags: [Upload]
 *     summary: Download a private file (org verification document)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: File content
 *       403:
 *         description: Forbidden
 *       404:
 *         description: File not found
 */
uploadRouter.get('/private/:filename', requireAuth, async (req, res, next) => {
  try {
    const filename = req.params.filename;
    if (!filename || filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
      res.status(400).json({ error: 'Invalid filename' });
      return;
    }

    // Must have an owning organizationDocument; otherwise file is orphaned and must not be served
    const doc = await prisma.organizationDocument.findFirst({
      where: { fileName: filename },
    });
    if (!doc) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    const isSysAdmin = hasSystemRole(req.user!.role);
    const callerOrgId = req.user!.organizationId;
    if (!isSysAdmin && doc.organizationId !== callerOrgId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    // Try local private dir first
    const localPath = path.join(PRIVATE_UPLOADS_DIR, filename);
    try {
      await fs.promises.access(localPath, fs.constants.R_OK);
      res.sendFile(localPath);
      return;
    } catch {
      // Not found locally — try S3 private prefix if configured
    }

    if (isS3Enabled() && getS3Client()) {
      const s3 = getS3Client()!;
      const { GetObjectCommand } = await import('@aws-sdk/client-s3');
      const bucket = process.env.S3_BUCKET_NAME!;
      try {
        const command = new GetObjectCommand({ Bucket: bucket, Key: `private/${filename}` });
        const data = await s3.send(command);
        if (!data.Body) {
          res.status(404).json({ error: 'File not found' });
          return;
        }
        if (data.ContentType) res.setHeader('Content-Type', data.ContentType);
        if (data.ContentLength) res.setHeader('Content-Length', String(data.ContentLength));
        if (data.ETag) res.setHeader('ETag', data.ETag);
        res.setHeader('Cache-Control', 'private, max-age=300');
        const body = data.Body as unknown as { pipe?: (res: unknown) => void; transformToByteArray?: () => Promise<Uint8Array> };
        if (typeof body.pipe === 'function') {
          (body as { pipe: (r: typeof res) => void }).pipe(res);
        } else if (body instanceof Uint8Array) {
          res.send(Buffer.from(body));
        } else if (typeof body.transformToByteArray === 'function') {
          const bytes = await body.transformToByteArray();
          res.send(Buffer.from(bytes));
        } else {
          res.send(body as unknown as Buffer);
        }
        return;
      } catch (s3Err) {
        logger.warn('S3 private GetObject failed', {
          filename,
          error: (s3Err as Error).message,
        });
      }
    }

    res.status(404).json({ error: 'File not found' });
  } catch (err) {
    next(err);
  }
});
