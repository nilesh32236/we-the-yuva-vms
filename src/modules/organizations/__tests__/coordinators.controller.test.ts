import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../coordinators.service', () => ({
  addCoordinator: vi.fn(),
  listCoordinators: vi.fn(),
  removeCoordinator: vi.fn(),
}));

const ctrl = await import('../coordinators.service');

import {
  addCoordinatorHandler,
  listCoordinatorsHandler,
  removeCoordinatorHandler,
} from '../coordinators.controller';

describe('coordinators.controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      body: {},
      params: {},
      user: {
        id: 'admin-id',
        role: 'ORGANIZATION_ADMIN',
        permissions: [],
        organizationId: 'org-1',
      },
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
    next = vi.fn() as unknown as NextFunction;
  });

  it('addCoordinatorHandler should throw 400 when name/email missing', async () => {
    req.params = { id: 'org-1' };
    req.body = {};
    await addCoordinatorHandler(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
  });

  it('addCoordinatorHandler should return 201', async () => {
    vi.mocked(ctrl.addCoordinator).mockResolvedValue({ id: 'coord-1' });
    req.params = { id: 'org-1' };
    req.body = { name: 'Coord', email: 'coord@test.com' };
    await addCoordinatorHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('listCoordinatorsHandler should return 200', async () => {
    vi.mocked(ctrl.listCoordinators).mockResolvedValue([]);
    req.params = { id: 'org-1' };
    await listCoordinatorsHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('removeCoordinatorHandler should return 204', async () => {
    vi.mocked(ctrl.removeCoordinator).mockResolvedValue({} as never);
    req.params = { id: 'org-1', userId: 'coord-id' };
    await removeCoordinatorHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(204);
  });
});
