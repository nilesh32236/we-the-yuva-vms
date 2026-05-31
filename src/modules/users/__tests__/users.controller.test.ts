import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../users.service', () => ({
  getMe: vi.fn(),
  updateUser: vi.fn(),
  upsertVolunteerProfile: vi.fn(),
  upsertStaffProfile: vi.fn(),
  getUserProfile: vi.fn(),
  getCoordinatorVolunteers: vi.fn(),
  exportCoordinatorVolunteers: vi.fn(),
}));

const svc = await import('../users.service');

import {
  createStaffProfile,
  createVolunteerProfile,
  exportVolunteersHandler,
  getCoordinatorVolunteersHandler,
  getMeHandler,
  getUserProfileHandler,
  updateMeHandler,
  updateStaffProfile,
  updateVolunteerProfile,
} from '../users.controller';

describe('users.controller', () => {
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
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
    };
    next = vi.fn() as unknown as NextFunction;
  });

  it('getMeHandler should return 200', async () => {
    vi.mocked(svc.getMe).mockResolvedValue({ id: 'user-1' });
    await getMeHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('updateMeHandler should return 200', async () => {
    vi.mocked(svc.updateUser).mockResolvedValue({ id: 'user-1' });
    req.body = { name: 'New Name' };
    await updateMeHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('createVolunteerProfile should return 201', async () => {
    vi.mocked(svc.upsertVolunteerProfile).mockResolvedValue({ id: 'profile-1' });
    await createVolunteerProfile(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('updateVolunteerProfile should return 200', async () => {
    vi.mocked(svc.upsertVolunteerProfile).mockResolvedValue({ id: 'profile-1' });
    await updateVolunteerProfile(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('createStaffProfile should return 201', async () => {
    vi.mocked(svc.upsertStaffProfile).mockResolvedValue({ id: 'user-1' });
    await createStaffProfile(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('updateStaffProfile should return 200', async () => {
    vi.mocked(svc.upsertStaffProfile).mockResolvedValue({ id: 'user-1' });
    await updateStaffProfile(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getUserProfileHandler should return 200', async () => {
    vi.mocked(svc.getUserProfile).mockResolvedValue({ id: 'user-2' });
    req.params = { id: 'user-2' };
    await getUserProfileHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getCoordinatorVolunteersHandler should return 200', async () => {
    vi.mocked(svc.getCoordinatorVolunteers).mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
    });
    req.query = { page: '1', limit: '20' };
    await getCoordinatorVolunteersHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('exportVolunteersHandler should return CSV', async () => {
    vi.mocked(svc.exportCoordinatorVolunteers).mockResolvedValue([
      {
        name: 'V',
        email: 'v@t.com',
        type: 'STUDENT',
        skills: [],
        totalHours: 0,
        applicationCount: 1,
      },
    ]);
    await exportVolunteersHandler(req as Request, res as Response, next);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
  });
});
