import 'express-async-errors';
import fs from 'node:fs';
import path from 'node:path';
import { setupExpressErrorHandler } from '@sentry/node';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { swaggerSpec } from './lib/swagger';
import { errorMiddleware } from './middleware/error.middleware';
import { adminRouter } from './modules/admin/admin.routes';
import { alertsRouter } from './modules/alerts/alerts.routes';
import { authRouter } from './modules/auth/auth.routes';
import {
  eventsRouter,
  eventSeriesRouter,
  opportunityEventsRouter,
  opportunityEventSeriesRouter,
} from './modules/events/events.routes';
import { feedbackRouter } from './modules/feedback/feedback.routes';
import { locationsRouter } from './modules/locations/locations.routes';
import { notificationsRouter } from './modules/notifications/notifications.routes';
import { opportunitiesRouter } from './modules/opportunities/opportunities.routes';
import { organizationsRouter } from './modules/organizations/organizations.routes';
import { statsRouter } from './modules/stats/stats.routes';
import { storiesRouter } from './modules/stories/stories.routes';
import { trainingRouter } from './modules/training/training.routes';
import { uploadRouter } from './modules/upload/upload.routes';
import { usersRouter } from './modules/users/users.routes';
import { levelsRouter } from './modules/levels/levels.routes';
import { leaderboardRouter } from './modules/leaderboard/leaderboard.routes';
import { badgesRouter } from './modules/badges/badges.routes';
import { blogRouter } from './modules/blog/blog.routes';
import { mentorshipRouter } from './modules/mentorship/mentorship.routes';
import { certificatesRouter } from './modules/certificates/certificates.routes';
import { chatRouter } from './modules/chat/chat.routes';
import { kindnessRouter } from './modules/kindness-challenge/kindness-challenge.routes';
import { youthProfilesRouter } from './modules/youth-profiles/youth-profiles.routes';
import { onboardingPart2Router } from './modules/onboarding-part2/onboarding-part2.routes';

export function createApp(): Express {
  const app = express();

  // Trust reverse proxy (HF Spaces always sends X-Forwarded-For)
  app.set('trust proxy', 1);

  // Security headers
  const allowedOrigins = env.FRONTEND_URL.split(',').map((o) => o.trim());
  const isProd = env.NODE_ENV === 'production';

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // CORS — locked down strictly to FRONTEND_URL in production, allowing Vercel previews in dev
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests without Origin (HF Spaces reverse proxy, curl, health checks)
        if (!origin) {
          return callback(null, true);
        }
        if (isProd) {
          if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
            return callback(null, true);
          }
          return callback(null, false);
        }
        // Dev / Test mode allows Vercel previews and local origins
        if (origin.endsWith('.vercel.app') || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        callback(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    })
  );

  // Compression — gzip/brotli for JSON responses
  app.use(compression());

  // Global rate limiter — protects all routes from brute force / DoS
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 600,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
  });
  app.use(globalLimiter);

  // Body parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  // HTTP request logging
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // Health check — used by Railway
  app.get('/api/v1/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: env.NODE_ENV,
        database: 'connected',
      });
    } catch (error) {
      logger.error('Health check failed', { error });
      res.status(503).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        environment: env.NODE_ENV,
        database: 'disconnected',
      });
    }
  });

  // Routes
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/users/me/onboarding/part2', onboardingPart2Router);
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1/kindness-challenge', kindnessRouter);
  app.use('/api/v1/opportunities', opportunitiesRouter);
  app.use('/api/v1/opportunities/:opportunityId/events', opportunityEventsRouter);
  app.use('/api/v1/opportunities/:opportunityId/event-series', opportunityEventSeriesRouter);
  app.use('/api/v1/events', eventsRouter);
  app.use('/api/v1/event-series', eventSeriesRouter);
  app.use('/api/v1/admin', adminRouter);
  app.use('/api/v1/organizations', organizationsRouter);
  app.use('/api/v1/stats', statsRouter);
  app.use('/api/v1/training', trainingRouter);
  app.use('/api/v1/notifications', notificationsRouter);
  app.use('/api/v1/stories', storiesRouter);
  app.use('/api/v1/blog', blogRouter);
  app.use('/api/v1/feedback', feedbackRouter);
  app.use('/api/v1/locations', locationsRouter);
  app.use('/api/v1/alerts', alertsRouter);

  // Tier / Level System
  app.use('/api/v1/levels', levelsRouter);
  app.use('/api/v1/leaderboard', leaderboardRouter);
  app.use('/api/v1/badges', badgesRouter);
  app.use('/api/v1/certificates', certificatesRouter);

  // Mentorship routes
  app.use('/api/v1/mentorship', mentorshipRouter);

  app.use('/api/v1/chat', chatRouter);

  // Upload routes
  app.use('/api/v1/youth-profiles', youthProfilesRouter);

  app.use('/api/v1/upload', uploadRouter);

  // Serve uploaded files — if S3 is configured, proxy to S3 when file not found locally
  // This allows frontend to always use /uploads/<filename> (or full backend URL) without needing direct S3 URL with Signature
  app.get('/uploads/:filename', async (req, res, next) => {
    try {
      const filename = req.params.filename;
      // Basic sanitization: prevent path traversal, allow only safe chars
      if (!filename || filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
        res.status(400).json({ error: 'Invalid filename' });
        return;
      }
      const localPath = path.resolve(process.env.UPLOADS_DIR || '/tmp/uploads', filename);
      // Check local file first (covers non-S3 mode and files that haven't been uploaded to S3 yet)
      try {
        await fs.promises.access(localPath, fs.constants.R_OK);
        // File exists locally — let static handler serve it (we send manually to avoid double handling)
        res.sendFile(localPath, { maxAge: '1d', etag: true } as any);
        return;
      } catch {
        // Not found locally — try S3 if configured
      }

      // Try S3 if configured
      const { getS3Client, isS3Enabled } = await import('./modules/upload/upload.service');
      if (isS3Enabled() && getS3Client()) {
        const s3 = getS3Client()!;
        const { GetObjectCommand } = await import('@aws-sdk/client-s3');
        const bucket = process.env.S3_BUCKET_NAME!;
        try {
          const command = new GetObjectCommand({ Bucket: bucket, Key: filename });
          const data = await s3.send(command);
          if (!data.Body) {
            res.status(404).json({ error: 'File not found' });
            return;
          }
          // Set appropriate headers
          if (data.ContentType) res.setHeader('Content-Type', data.ContentType);
          if (data.ContentLength) res.setHeader('Content-Length', String(data.ContentLength));
          if (data.ETag) res.setHeader('ETag', data.ETag);
          res.setHeader('Cache-Control', 'public, max-age=86400');
          // Stream S3 body to response (Body can be Readable or Uint8Array)
          const body = data.Body as any;
          if (typeof body.pipe === 'function') {
            body.pipe(res);
          } else if (body instanceof Uint8Array) {
            res.send(Buffer.from(body));
          } else if (typeof body.transformToByteArray === 'function') {
            const bytes = await body.transformToByteArray();
            res.send(Buffer.from(bytes));
          } else {
            // Fallback: try to read as stream
            res.send(body);
          }
          return;
        } catch (s3Err) {
          logger.warn('S3 GetObject failed, falling back to 404', {
            filename,
            error: (s3Err as Error).message,
          });
          // Fall through to 404
        }
      }

      res.status(404).json({ error: 'File not found' });
    } catch (err) {
      next(err);
    }
  });

  // Fallback static for any remaining /uploads requests (e.g., directory listing, if any)
  app.use(
    '/uploads',
    express.static(path.resolve(process.env.UPLOADS_DIR || '/tmp/uploads'), { maxAge: '1d', etag: true })
  );

  // Swagger/OpenAPI docs
  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api/v1/docs.json', (_req, res) => res.json(swaggerSpec));

  // VAPID public key endpoint (no auth required for service worker)
  app.get('/api/v1/vapid-public-key', (_req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.json({ publicKey: env.VAPID_PUBLIC_KEY });
  });

  // 404 catch-all for unknown API routes
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  // Sentry error handler (must be before our handler)
  setupExpressErrorHandler(app);

  // Global error handler — must be last
  app.use(errorMiddleware);

  return app;
}
