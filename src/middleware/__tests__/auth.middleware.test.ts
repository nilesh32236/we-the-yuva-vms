import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { describe, expect, it, vi } from 'vitest';

vi.mock('jsonwebtoken', () => {
  const verify = vi.fn();
  class TokenExpiredError extends Error {
    constructor(m: string) { super(m); this.name = 'TokenExpiredError'; }
  }
  class NotBeforeError extends Error {
    constructor(m: string) { super(m); this.name = 'NotBeforeError'; }
  }
  class JsonWebTokenError extends Error {
    constructor(m: string) { super(m); this.name = 'JsonWebTokenError'; }
  }
  return {
    default: { verify, TokenExpiredError, NotBeforeError, JsonWebTokenError },
    verify,
    TokenExpiredError,
    NotBeforeError,
    JsonWebTokenError,
  };
});

import { requireAuth } from '../auth.middleware';

describe('auth.middleware - requireAuth', () => {
  it('should return 401 when no Authorization header', () => {
    const req = { headers: {} } as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when header does not start with Bearer', () => {
    const req = { headers: { authorization: 'Basic token' } } as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should return 401 when token verification fails', () => {
    const req = { headers: { authorization: 'Bearer invalid-token' } } as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn() as NextFunction;
    vi.mocked(jwt.verify).mockImplementation(() => {
      throw new Error('invalid');
    });

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should attach user to request when token is valid', () => {
    const req = {
      headers: { authorization: 'Bearer valid-token' },
    } as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn() as NextFunction;
    vi.mocked(jwt.verify).mockReturnValue({
      sub: 'user-1',
      role: 'ADMIN',
      permissions: ['user:manage'],
      org: 'org-1',
      iat: 1000000,
      exp: 2000000,
    } as never);

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user!.id).toBe('user-1');
    expect(req.user!.role).toBe('ADMIN');
    expect(req.user!.permissions).toEqual(['user:manage']);
    expect(req.user!.organizationId).toBe('org-1');
  });

  it('should handle missing org field gracefully', () => {
    const req = {
      headers: { authorization: 'Bearer valid-token' },
    } as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn() as NextFunction;
    vi.mocked(jwt.verify).mockReturnValue({
      sub: 'user-1',
      role: 'VOLUNTEER',
      permissions: [],
      iat: 1000000,
      exp: 2000000,
    } as never);

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user!.organizationId).toBeUndefined();
  });
});
