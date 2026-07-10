import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

import { requirePermission, requireRole } from '../rbac.middleware';

describe('rbac.middleware - requireRole', () => {
  it('should return 401 when user is not attached to request', () => {
    const req = {} as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    requireRole('ADMIN')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 when user role is not in allowed list', () => {
    const req = { user: { id: '1', role: 'VOLUNTEER', permissions: [] } } as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    requireRole('ADMIN')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('should allow access when role matches', () => {
    const req = { user: { id: '1', role: 'ADMIN', permissions: [] } } as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    requireRole('ADMIN')(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should allow access when role is in multiple allowed roles', () => {
    const req = { user: { id: '1', role: 'COORDINATOR', permissions: [] } } as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    requireRole('ADMIN', 'COORDINATOR')(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});

describe('rbac.middleware - requirePermission', () => {
  it('should return 401 when user is not attached to request', () => {
    const req = {} as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    requirePermission('user:manage')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should return 403 when user lacks required permission', () => {
    const req = {
      user: { id: '1', role: 'VOLUNTEER', permissions: ['opportunity:view'] },
    } as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    requirePermission('user:manage')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('should allow access when user has required permission', () => {
    const req = { user: { id: '1', role: 'ADMIN', permissions: ['user:manage'] } } as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    requirePermission('user:manage')(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should require ALL permissions when multiple are specified', () => {
    const req = { user: { id: '1', role: 'ADMIN', permissions: ['perm:a', 'perm:b'] } } as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    requirePermission('perm:a', 'perm:b')(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should deny when user has only some of the required permissions', () => {
    const req = { user: { id: '1', role: 'ADMIN', permissions: ['perm:a'] } } as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    requirePermission('perm:a', 'perm:b')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle empty permissions array', () => {
    const req = { user: { id: '1', role: 'VOLUNTEER', permissions: [] } } as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    requirePermission('user:manage')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});
