import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../preferences.service', () => ({
  getPreferences: vi.fn(),
  updatePreference: vi.fn(),
}));

const svc = await import('../preferences.service');

import { getPreferencesHandler, updatePreferenceHandler } from '../preferences.controller';

describe('preferences.controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      body: {},
      params: {},
      query: {},
      user: { id: 'user-1', role: 'VOLUNTEER', permissions: [], organizationId: null },
    };
    res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
    next = vi.fn() as unknown as NextFunction;
  });

  it('getPreferencesHandler should return 200', async () => {
    vi.mocked(svc.getPreferences).mockResolvedValue([]);
    await getPreferencesHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('updatePreferenceHandler should return 200', async () => {
    vi.mocked(svc.updatePreference).mockResolvedValue({} as never);
    req.params = { type: 'APPLICATION_ACCEPTED' };
    req.body = { email: false };
    await updatePreferenceHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
