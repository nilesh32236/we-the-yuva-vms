import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import * as Sentry from '@sentry/node';
import { env } from '../config/env';
import { logger } from '../lib/logger';

export interface JwtPayload {
  sub: string;
  role: string;
  permissions: string[];
  org?: string | null;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        permissions: string[];
        organizationId?: string | null;
      };
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: 'we-the-yuva-api',
      algorithms: ['HS256'],
    }) as JwtPayload;
    req.user = {
      id: payload.sub,
      role: payload.role,
      permissions: payload.permissions ?? [],
      organizationId: payload.org,
    };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      logger.warn('Auth failed: token expired', {
        error: err.message,
        path: req.path,
        ip: req.ip,
      });
      Sentry.captureException(err);
      res.status(401).json({ error: 'Token expired' });
      return;
    }
    if (err instanceof jwt.NotBeforeError) {
      logger.warn('Auth failed: token not yet active', {
        error: err.message,
        path: req.path,
        ip: req.ip,
      });
      Sentry.captureException(err);
      res.status(401).json({ error: 'Token not yet active' });
      return;
    }
    if (err instanceof jwt.JsonWebTokenError) {
      logger.warn('Auth failed: invalid token', {
        error: err.message,
        path: req.path,
        ip: req.ip,
      });
      Sentry.captureException(err);
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    logger.warn('Auth failed: unauthorized', {
      error: (err as Error).message,
      errorType: (err as Error).constructor.name,
      path: req.path,
      ip: req.ip,
    });
    Sentry.captureException(err);
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
}
