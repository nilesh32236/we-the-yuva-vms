import path from 'node:path';
import { setupExpressErrorHandler } from '@sentry/node';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { prisma } from './lib/prisma';
import { swaggerSpec } from './lib/swagger';
import { errorMiddleware } from './middleware/error.middleware';
import { adminRouter } from './modules/admin/admin.routes';
import { alertsRouter } from './modules/alerts/alerts.routes';
import { authRouter } from './modules/auth/auth.routes';
import { eventsRouter, opportunityEventsRouter } from './modules/events/events.routes';
import { feedbackRouter } from './modules/feedback/feedback.routes';
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
import { mentorshipRouter } from './modules/mentorship/mentorship.routes';
import { certificatesRouter } from './modules/certificates/certificates.routes';
import { chatRouter } from './modules/chat/chat.routes';
import { youthProfilesRouter } from './modules/youth-profiles/youth-profiles.routes';

export function createApp(): Express {
  const app = express();

  // Trust reverse proxy (HF Spaces always sends X-Forwarded-For)
  app.set('trust proxy', 1);

  // Security headers
  const allowedOrigins = env.FRONTEND_URL.split(',').map((o) => o.trim());
  const isProd = env.NODE_ENV === 'production';

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"], // Needed for Swagger UI inline scripts
          styleSrc: ["'self'", "'unsafe-inline'"], // Needed for Swagger UI inline styles
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'", ...allowedOrigins, '*.vercel.app'],
        },
      },
      crossOriginEmbedderPolicy: false,
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
          return callback(new Error(`CORS: origin ${origin} not allowed in production`));
        }
        // Dev / Test mode allows Vercel previews and local origins
        if (origin.endsWith('.vercel.app') || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        callback(new Error(`CORS: origin ${origin} not allowed`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Body parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
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
    } catch {
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
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1/opportunities', opportunitiesRouter);
  app.use('/api/v1/opportunities/:opportunityId/events', opportunityEventsRouter);
  app.use('/api/v1/events', eventsRouter);
  app.use('/api/v1/admin', adminRouter);
  app.use('/api/v1/organizations', organizationsRouter);
  app.use('/api/v1/stats', statsRouter);
  app.use('/api/v1/training', trainingRouter);
  app.use('/api/v1/notifications', notificationsRouter);
  app.use('/api/v1/stories', storiesRouter);
  app.use('/api/v1/feedback', feedbackRouter);
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

  // Serve uploaded files
  app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

  // Swagger/OpenAPI docs
  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api/v1/docs.json', (_req, res) => res.json(swaggerSpec));

  // VAPID public key endpoint (no auth required for service worker)
  app.get('/api/v1/vapid-public-key', (_req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.json({ publicKey: env.VAPID_PUBLIC_KEY });
  });

  // Sentry error handler (must be before our handler)
  setupExpressErrorHandler(app);

  // Global error handler — must be last
  app.use(errorMiddleware);

  return app;
}
