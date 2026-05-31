import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/modules/stats/stats.service', () => ({
  getAdminStats: vi.fn(),
  getAdminOrgStats: vi.fn(),
}));

vi.mock('../admin.service', () => ({
  createUser: vi.fn(),
  listUsers: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock('@/modules/organizations/organizations.service', () => ({
  listOrganizations: vi.fn(),
  verifyOrganization: vi.fn(),
  suspendOrganization: vi.fn(),
  getOrganizationDocuments: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: { role: { findMany: vi.fn() } },
}));

const adminService = await import('../admin.service');
const statsService = await import('@/modules/stats/stats.service');
const orgService = await import('@/modules/organizations/organizations.service');
const { prisma } = await import('@/lib/prisma');

import {
  adminStatsHandler,
  createUserHandler,
  listUsersHandler,
  updateUserHandler,
} from '../admin.controller';
import {
  adminGetOrgDocumentsHandler,
  adminListOrgsHandler,
  adminOrgStatsHandler,
  adminSuspendOrgHandler,
  adminVerifyOrgHandler,
} from '../admin.organizations.controller';
import { listRolesHandler } from '../admin.roles.controller';

describe('admin.controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      body: {},
      params: {},
      query: {},
      user: { id: 'admin-1', role: 'ADMIN', permissions: [], organizationId: null },
    };
    res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
    next = vi.fn() as unknown as NextFunction;
  });

  describe('admin users', () => {
    it('createUserHandler should return 201', async () => {
      vi.mocked(adminService.createUser).mockResolvedValue({ id: 'user-1' });
      await createUserHandler(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('listUsersHandler should return 200', async () => {
      vi.mocked(adminService.listUsers).mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
      });
      await listUsersHandler(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('updateUserHandler should return 200', async () => {
      vi.mocked(adminService.updateUser).mockResolvedValue({ id: 'user-1' });
      req.params = { id: 'user-1' };
      await updateUserHandler(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('adminStatsHandler should return 200', async () => {
      vi.mocked(statsService.getAdminStats).mockResolvedValue({
        totalUsers: 100,
        activeVolunteers: 50,
        totalHours: 500,
        totalOrgs: 10,
        pendingOrgs: 2,
        activeOrgs: 8,
      });
      await adminStatsHandler(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('admin organizations', () => {
    it('adminListOrgsHandler should return 200', async () => {
      vi.mocked(orgService.listOrganizations).mockResolvedValue({
        orgs: [],
        total: 0,
        page: 1,
        limit: 20,
      });
      await adminListOrgsHandler(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('adminVerifyOrgHandler should return 200', async () => {
      vi.mocked(orgService.verifyOrganization).mockResolvedValue({ id: 'org-1', status: 'ACTIVE' });
      req.params = { id: 'org-1' };
      req.body = { approved: true };
      await adminVerifyOrgHandler(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('adminVerifyOrgHandler should throw 400 when approved missing', async () => {
      req.params = { id: 'org-1' };
      req.body = {};
      await adminVerifyOrgHandler(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
    });

    it('adminSuspendOrgHandler should return 200', async () => {
      vi.mocked(orgService.suspendOrganization).mockResolvedValue({
        id: 'org-1',
        status: 'SUSPENDED',
      });
      req.params = { id: 'org-1' };
      await adminSuspendOrgHandler(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('adminOrgStatsHandler should return 200', async () => {
      vi.mocked(statsService.getAdminOrgStats).mockResolvedValue({
        total: 20,
        pending: 3,
        active: 15,
        suspended: 2,
      });
      await adminOrgStatsHandler(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('adminGetOrgDocumentsHandler should return 200', async () => {
      vi.mocked(orgService.getOrganizationDocuments).mockResolvedValue([]);
      req.params = { id: 'org-1' };
      await adminGetOrgDocumentsHandler(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('admin roles', () => {
    it('listRolesHandler should return roles', async () => {
      vi.mocked(prisma.role.findMany).mockResolvedValue([
        { id: 'role-1', name: 'ADMIN', description: '', permissions: [] },
      ] as never);
      await listRolesHandler(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ roles: expect.any(Array) });
    });
  });
});
