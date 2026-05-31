import type { NextFunction, Request, Response } from 'express';
import type { Permission } from '../shared/permissions';

type Role = 'VOLUNTEER' | 'COORDINATOR' | 'ORGANIZATION_ADMIN' | 'ADMIN' | 'OBSERVER';

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!roles.includes(req.user.role as Role)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    next();
  };
}

export function requirePermission(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userPermissions = req.user.permissions ?? [];
    const hasAll = permissions.every((p) => userPermissions.includes(p));
    if (!hasAll) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    next();
  };
}
