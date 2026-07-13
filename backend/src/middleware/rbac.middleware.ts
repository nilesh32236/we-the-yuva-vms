import type { NextFunction, Request, Response } from 'express';
import type { Permission } from '../shared/permissions';
import type { UserRole } from '../shared/types';
import { logger } from '../lib/logger';

type Role = UserRole;

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      logger.warn('RBAC: no user on request');
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!roles.includes(req.user.role as Role)) {
      logger.warn('RBAC: role not authorized', {
        userId: req.user.id,
        role: req.user.role,
        requiredRoles: roles,
      });
      res
        .status(403)
        .json({
          error: `You do not have the required role for this action. Required: ${roles.join(', ')}`,
        });
      return;
    }

    next();
  };
}

export function requirePermission(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      logger.warn('RBAC: no user on request');
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userPermissions = req.user.permissions ?? [];
    const hasAll = permissions.every((p) => userPermissions.includes(p));
    if (!hasAll) {
      logger.warn('RBAC: insufficient permissions', {
        userId: req.user.id,
        role: req.user.role,
        requiredPermissions: permissions,
      });
      res
        .status(403)
        .json({
          error: `You do not have permission to perform this action. Required permission: ${permissions.join(', ')}`,
        });
      return;
    }

    next();
  };
}
