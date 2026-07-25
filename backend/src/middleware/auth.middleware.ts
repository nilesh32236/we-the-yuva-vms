import { promisify } from 'node:util';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
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

const jwtVerify: (
  token: string,
  secret: string,
  options?: jwt.VerifyOptions
) => Promise<JwtPayload> = promisify(jwt.verify.bind(jwt)) as unknown as (
  token: string,
  secret: string,
  options?: jwt.VerifyOptions
) => Promise<JwtPayload>;

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies?.access_token) {
    token = req.cookies.access_token;
  }

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const payload = await jwtVerify(token, env.JWT_ACCESS_SECRET, {
      issuer: 'we-the-yuva-api',
      algorithms: ['HS256'],
    });
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
      res.status(401).json({ error: 'Token expired' });
      return;
    }
    if (err instanceof jwt.NotBeforeError) {
      logger.warn('Auth failed: token not yet active', {
        error: err.message,
        path: req.path,
        ip: req.ip,
      });
      res.status(401).json({ error: 'Token not yet active' });
      return;
    }
    if (err instanceof jwt.JsonWebTokenError) {
      logger.warn('Auth failed: invalid token', {
        error: err.message,
        path: req.path,
        ip: req.ip,
      });
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    logger.warn('Auth failed: unauthorized', {
      error: (err as Error).message,
      errorType: (err as Error).constructor.name,
      path: req.path,
      ip: req.ip,
    });
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
}
