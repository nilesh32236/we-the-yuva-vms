import type { NextFunction, Request, Response } from 'express';

type Role = 'VOLUNTEER' | 'COORDINATOR' | 'ADMIN' | 'OBSERVER';

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
