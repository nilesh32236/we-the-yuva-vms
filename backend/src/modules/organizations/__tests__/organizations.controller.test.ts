import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../organizations.service', () => ({
  registerOrganization: vi.fn(),
  getOrganization: vi.fn(),
  updateOrganization: vi.fn(),
  addOrganizationDocument: vi.fn(),
  getOrganizationDocuments: vi.fn(),
  addCoordinatorToOrg: vi.fn(),
  listCoordinators: vi.fn(),
  removeCoordinatorFromOrg: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: { organization: { findMany: vi.fn(), count: vi.fn() } },
}));

const mockService = await import('../organizations.service');
const { prisma } = await import('@/lib/prisma');

import {
  addCoordinatorHandler,
  getDocumentsHandler,
  getOrgHandler,
  listCoordinatorsHandler,
  listOrgsHandler,
  registerOrgHandler,
  removeCoordinatorHandler,
  updateOrgHandler,
  uploadDocumentHandler,
} from '../organizations.controller';

describe('organizations.controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      body: {},
      params: {},
      query: {},
      user: { id: 'user-1', role: 'ORGANIZATION_ADMIN', permissions: [], organizationId: 'org-1' },
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
    next = vi.fn() as unknown as NextFunction;
  });

  it('registerOrgHandler should return 201', async () => {
    vi.mocked(mockService.registerOrganization).mockResolvedValue({ id: 'org-1' });
    req.body = { name: 'New Org' };
    await registerOrgHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('getOrgHandler should return 200', async () => {
    vi.mocked(mockService.getOrganization).mockResolvedValue({ id: 'org-1' });
    req.params = { id: 'org-1' };
    await getOrgHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('updateOrgHandler should return 200', async () => {
    vi.mocked(mockService.updateOrganization).mockResolvedValue({ id: 'org-1' });
    req.params = { id: 'org-1' };
    req.body = { name: 'Updated' };
    await updateOrgHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('uploadDocumentHandler should throw 400 when fields missing', async () => {
    req.params = { id: 'org-1' };
    req.body = {};
    await uploadDocumentHandler(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
  });

  it('getDocumentsHandler should return 200', async () => {
    vi.mocked(mockService.getOrganizationDocuments).mockResolvedValue([]);
    req.params = { id: 'org-1' };
    await getDocumentsHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('listOrgsHandler should return paginated orgs', async () => {
    vi.mocked(prisma.organization.findMany).mockResolvedValue([]);
    vi.mocked(prisma.organization.count).mockResolvedValue(0);
    req.query = { page: '1', limit: '20' };
    await listOrgsHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ orgs: [], total: 0 }));
  });

  it('addCoordinatorHandler should return 201', async () => {
    vi.mocked(mockService.addCoordinatorToOrg).mockResolvedValue({ id: 'coord-1' });
    req.params = { id: 'org-1' };
    req.body = { name: 'C', email: 'c@t.com' };
    await addCoordinatorHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('addCoordinatorHandler should throw 400 when name/email missing', async () => {
    req.params = { id: 'org-1' };
    req.body = {};
    await addCoordinatorHandler(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
  });

  it('listCoordinatorsHandler should return 200', async () => {
    vi.mocked(mockService.listCoordinators).mockResolvedValue([]);
    req.params = { id: 'org-1' };
    await listCoordinatorsHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('removeCoordinatorHandler should return 204', async () => {
    vi.mocked(mockService.removeCoordinatorFromOrg).mockResolvedValue({} as never);
    req.params = { id: 'org-1', userId: 'coord-1' };
    await removeCoordinatorHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(204);
  });
});
