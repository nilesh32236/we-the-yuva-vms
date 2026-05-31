import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    role: { findUnique: vi.fn() },
    refreshToken: { findUnique: vi.fn() },
    consentRecord: { findUnique: vi.fn(), create: vi.fn() },
  },
}));

vi.mock('@/lib/audit', () => ({ logAudit: vi.fn() }));

vi.mock('../auth.service', () => ({
  checkOtpRateLimit: vi.fn(),
  generateAndStoreOtp: vi.fn(),
  verifyOtp: vi.fn(),
  signAccessToken: vi.fn(),
  signRefreshToken: vi.fn(),
  storeRefreshToken: vi.fn(),
  revokeRefreshToken: vi.fn(),
  rotateRefreshToken: vi.fn(),
  enqueueOtpEmail: vi.fn(),
}));

const { prisma } = await import('@/lib/prisma');
const { logAudit } = await import('@/lib/audit');
const authService = await import('../auth.service');

import {
  logout,
  recordConsent,
  refresh,
  register,
  sendOtp,
  verifyOtpHandler,
} from '../auth.controller';

describe('auth.controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      body: {},
      params: {},
      cookies: {},
      user: { id: 'user-1', role: 'VOLUNTEER', permissions: [], organizationId: null },
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      cookie: vi.fn().mockReturnThis(),
      clearCookie: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
    next = vi.fn() as unknown as NextFunction;
  });

  describe('register', () => {
    it('should create a new user successfully', async () => {
      req.body = { email: 'new@test.com', name: 'New User', volunteerType: 'STUDENT' };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.role.findUnique).mockResolvedValue({
        id: 'role-vol',
        name: 'VOLUNTEER',
        description: '',
        permissions: [],
      } as never);
      vi.mocked(prisma.user.create).mockResolvedValue({ id: 'new-id' } as never);

      await register(req as Request, res as Response, next);

      expect(prisma.user.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(logAudit).toHaveBeenCalled();
    });

    it('should return 409 when email already exists', async () => {
      req.body = { email: 'existing@test.com', name: 'Existing' };
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'existing-id' } as never);

      await register(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 409 }));
    });

    it('should return 500 when VOLUNTEER role not found', async () => {
      req.body = { email: 'new@test.com', name: 'New User' };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.role.findUnique).mockResolvedValue(null);

      await register(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 500 }));
    });

    it('should register without volunteerType', async () => {
      req.body = { email: 'new@test.com', name: 'New User' };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.role.findUnique).mockResolvedValue({
        id: 'role-vol',
        name: 'VOLUNTEER',
        description: '',
        permissions: [],
      } as never);
      vi.mocked(prisma.user.create).mockResolvedValue({ id: 'new-id' } as never);

      await register(req as Request, res as Response, next);

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({ volunteerType: expect.anything() }),
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('sendOtp', () => {
    it('should return generic message when user not found', async () => {
      req.body = { email: 'unknown@test.com' };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await sendOtp(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('registered') })
      );
    });

    it('should send OTP for existing user', async () => {
      req.body = { email: 'known@test.com' };
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1' } as never);
      vi.mocked(authService.checkOtpRateLimit).mockResolvedValue();
      vi.mocked(authService.generateAndStoreOtp).mockResolvedValue('123456');
      vi.mocked(authService.enqueueOtpEmail).mockResolvedValue();

      await sendOtp(req as Request, res as Response, next);

      expect(authService.generateAndStoreOtp).toHaveBeenCalledWith('known@test.com');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('verifyOtpHandler', () => {
    it('should verify OTP and return tokens', async () => {
      req.body = { email: 'test@test.com', otp: '123456' };
      vi.mocked(authService.verifyOtp).mockResolvedValue();
      vi.mocked(prisma.user.update).mockResolvedValue({
        id: 'user-1',
        name: 'Test',
        email: 'test@test.com',
        roleRef: { name: 'VOLUNTEER', permissions: [] },
        status: 'ACTIVE',
        locationId: null,
        organizationId: null,
        consent: null,
        profile: null,
      } as never);
      vi.mocked(authService.signAccessToken).mockReturnValue('access-token');
      vi.mocked(authService.signRefreshToken).mockReturnValue('refresh-token');
      vi.mocked(authService.storeRefreshToken).mockResolvedValue('refresh-token');

      await verifyOtpHandler(req as Request, res as Response, next);

      expect(authService.verifyOtp).toHaveBeenCalledWith('test@test.com', '123456');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.cookie).toHaveBeenCalledWith('access_token', 'access-token', expect.any(Object));
    });
  });

  describe('refresh', () => {
    it('should throw 401 when no refresh token cookie', async () => {
      req.cookies = {};
      await refresh(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
    });

    it('should rotate tokens successfully', async () => {
      req.cookies = { refresh_token: 'old-refresh-token' };
      vi.mocked(authService.rotateRefreshToken).mockResolvedValue({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
        userId: 'user-1',
        role: 'VOLUNTEER',
      });

      await refresh(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.cookie).toHaveBeenCalledWith('access_token', 'new-access', expect.any(Object));
    });
  });

  describe('logout', () => {
    it('should clear cookies and revoke token', async () => {
      req.cookies = { refresh_token: 'refresh-token' };
      vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue({
        id: '1',
        userId: 'user-1',
        tokenHash: 'hash',
      } as never);

      await logout(req as Request, res as Response, next);

      expect(res.clearCookie).toHaveBeenCalledWith('access_token', expect.any(Object));
      expect(res.clearCookie).toHaveBeenCalledWith('refresh_token', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(204);
    });

    it('should handle logout without refresh token', async () => {
      req.cookies = {};
      await logout(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(204);
    });
  });

  describe('recordConsent', () => {
    it('should record consent successfully', async () => {
      req.body = { privacyPolicyAccepted: true, mediaConsentAccepted: true };
      vi.mocked(prisma.consentRecord.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.consentRecord.create).mockResolvedValue({ id: 'consent-1' } as never);

      await recordConsent(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should throw 400 when privacy policy not accepted', async () => {
      req.body = { privacyPolicyAccepted: false, mediaConsentAccepted: false };
      await recordConsent(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
    });

    it('should throw 409 when consent already recorded', async () => {
      req.body = { privacyPolicyAccepted: true, mediaConsentAccepted: true };
      vi.mocked(prisma.consentRecord.findUnique).mockResolvedValue({ id: 'existing' } as never);

      await recordConsent(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 409 }));
    });
  });
});
