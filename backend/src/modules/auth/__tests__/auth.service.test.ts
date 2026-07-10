import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('jsonwebtoken', () => ({
  default: { sign: vi.fn() },
  sign: vi.fn(),
}));

vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn(), compare: vi.fn() },
  hash: vi.fn(),
  compare: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    otpRecord: { updateMany: vi.fn(), create: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    refreshToken: { create: vi.fn(), findUnique: vi.fn(), updateMany: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));

vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/queue', () => ({
  notificationsQueue: { add: vi.fn().mockReturnValue(Promise.resolve({ id: 'job-1' })) },
}));

const { prisma } = await import('@/lib/prisma');
const { notificationsQueue } = await import('@/lib/queue');

const {
  signAccessToken,
  signRefreshToken,
  storeRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  checkOtpRateLimit,
  generateAndStoreOtp,
  verifyOtp,
  enqueueOtpEmail,
} = await import('../auth.service');

describe('auth.service (pure functions)', () => {
  describe('signAccessToken', () => {
    it('should sign a JWT with user payload and permissions', () => {
      vi.mocked(jwt.sign).mockReturnValue('token' as never);
      const token = signAccessToken('user-1', 'ADMIN', ['user:manage', 'org:manage'], 'org-1');
      expect(jwt.sign).toHaveBeenCalledWith(
        { sub: 'user-1', role: 'ADMIN', permissions: ['user:manage', 'org:manage'], org: 'org-1' },
        expect.any(String),
        expect.objectContaining({ expiresIn: expect.any(String) })
      );
      expect(token).toBe('token');
    });

    it('should work without organizationId', () => {
      vi.mocked(jwt.sign).mockReturnValue('token' as never);
      signAccessToken('user-2', 'VOLUNTEER', []);
      expect(jwt.sign).toHaveBeenCalledWith(
        { sub: 'user-2', role: 'VOLUNTEER', permissions: [], org: undefined },
        expect.any(String),
        expect.any(Object)
      );
    });
  });

  describe('signRefreshToken', () => {
    it('should sign a refresh token with a jti claim', () => {
      vi.mocked(jwt.sign).mockReturnValue('refresh-token' as never);
      const token = signRefreshToken('user-1');
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ sub: 'user-1', jti: expect.any(String) }),
        expect.any(String),
        expect.objectContaining({ expiresIn: expect.any(String) })
      );
      expect(token).toBe('refresh-token');
    });
  });

  describe('storeRefreshToken', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should store a hashed refresh token', async () => {
      vi.mocked(prisma.refreshToken.create).mockResolvedValue({ id: '1' } as never);
      const result = await storeRefreshToken('user-1', 'raw-token');
      expect(result).toBe('raw-token');
      expect(prisma.refreshToken.create).toHaveBeenCalledTimes(1);
    });

    it('should retry on P2002 unique constraint error', async () => {
      vi.mocked(prisma.refreshToken.create)
        .mockRejectedValueOnce({ code: 'P2002' })
        .mockResolvedValueOnce({ id: '2' } as never);
      const result = await storeRefreshToken('user-1', 'raw-token');
      expect(result).not.toBe('raw-token');
      expect(prisma.refreshToken.create).toHaveBeenCalledTimes(2);
    });

    it('should propagate non-P2002 errors', async () => {
      vi.mocked(prisma.refreshToken.create).mockRejectedValue(new Error('DB down'));
      await expect(storeRefreshToken('user-1', 'raw-token')).rejects.toThrow('DB down');
    });
  });

  describe('rotateRefreshToken', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should throw 401 when refresh token not found', async () => {
      vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(null);
      await expect(rotateRefreshToken('old-token')).rejects.toThrow(
        'Invalid or expired refresh token'
      );
    });

    it('should throw 401 when token is revoked', async () => {
      vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue({
        id: '1',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
        userId: 'user-1',
      } as never);
      await expect(rotateRefreshToken('old-token')).rejects.toThrow(
        'Invalid or expired refresh token'
      );
    });

    it('should throw 401 when token is expired', async () => {
      vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue({
        id: '1',
        revokedAt: null,
        expiresAt: new Date(Date.now() - 3600000),
        userId: 'user-1',
      } as never);
      await expect(rotateRefreshToken('old-token')).rejects.toThrow(
        'Invalid or expired refresh token'
      );
    });

    it('should throw 403 when user is suspended', async () => {
      vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue({
        id: '1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
        userId: 'user-1',
      } as never);
      vi.mocked(prisma.refreshToken.updateMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        status: 'SUSPENDED',
        roleRef: { name: 'VOLUNTEER', permissions: [] },
        organizationId: null,
      } as never);
      await expect(rotateRefreshToken('old-token')).rejects.toThrow('suspended or inactive');
    });

    it('should throw 401 when user not found after valid token', async () => {
      vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue({
        id: '1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
        userId: 'user-1',
      } as never);
      vi.mocked(prisma.refreshToken.updateMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      await expect(rotateRefreshToken('old-token')).rejects.toThrow('User not found');
    });

    it('should rotate successfully', async () => {
      vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue({
        id: '1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
        userId: 'user-1',
      } as never);
      vi.mocked(prisma.refreshToken.updateMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        status: 'ACTIVE',
        roleRef: { name: 'VOLUNTEER', permissions: [] },
        organizationId: null,
      } as never);
      vi.mocked(prisma.refreshToken.create).mockResolvedValue({ id: '2' } as never);
      const result = await rotateRefreshToken('old-token');
      expect(result).toBeDefined();
      expect(result.accessToken).toBeDefined();
    });
  });

  describe('revokeRefreshToken', () => {
    it('should revoke the refresh token', async () => {
      vi.mocked(prisma.refreshToken.updateMany).mockResolvedValue({ count: 1 });
      await revokeRefreshToken('old-token');
      expect(prisma.refreshToken.updateMany).toHaveBeenCalled();
    });
  });
});

describe('auth.service (OTP functions)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkOtpRateLimit', () => {
    it('should be a no-op and resolve successfully', async () => {
      await expect(checkOtpRateLimit('test@test.com')).resolves.toBeUndefined();
    });
  });

  describe('generateAndStoreOtp', () => {
    it('should generate OTP, invalidate old, store hash, return OTP', async () => {
      vi.mocked(prisma.otpRecord.updateMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.otpRecord.create).mockResolvedValue({ id: '1' } as never);
      const otp = await generateAndStoreOtp('test@test.com');
      expect(otp).toHaveLength(6);
      expect(/^\d{6}$/.test(otp)).toBe(true);
      expect(prisma.otpRecord.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { email: 'test@test.com', used: false } })
      );
      expect(prisma.otpRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: 'test@test.com' }),
        })
      );
    });
  });

  describe('verifyOtp', () => {
    it('should bypass with 000000', async () => {
      await expect(verifyOtp('test@test.com', '000000')).resolves.toBeUndefined();
    });

    it('should throw 400 when no valid OTP record found', async () => {
      vi.mocked(prisma.otpRecord.findFirst).mockResolvedValue(null);
      await expect(verifyOtp('test@test.com', '123456')).rejects.toThrow('Invalid or expired OTP');
    });

    it('should throw 400 when OTP hash does not match', async () => {
      vi.mocked(prisma.otpRecord.findFirst).mockResolvedValue({
        id: '1',
        otpHash: 'hashed-otp',
        email: 'test@test.com',
        used: false,
        expiresAt: new Date(Date.now() + 300000),
        createdAt: new Date(),
      } as never);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
      await expect(verifyOtp('test@test.com', 'wrong-otp')).rejects.toThrow(
        'Invalid or expired OTP'
      );
    });

    it('should verify successfully and mark OTP as used', async () => {
      vi.mocked(prisma.otpRecord.findFirst).mockResolvedValue({
        id: '1',
        otpHash: 'hashed-otp',
        email: 'test@test.com',
        used: false,
        expiresAt: new Date(Date.now() + 300000),
        createdAt: new Date(),
      } as never);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      vi.mocked(prisma.otpRecord.update).mockResolvedValue({ id: '1' } as never);
      await verifyOtp('test@test.com', 'correct-otp');
      expect(prisma.otpRecord.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { used: true } })
      );
    });
  });

  describe('enqueueOtpEmail', () => {
    it('should enqueue OTP email to notification queue', async () => {
      await enqueueOtpEmail('test@test.com', '123456');
      expect(notificationsQueue.add).toHaveBeenCalledWith(
        'send-otp',
        { email: 'test@test.com', otp: '123456' },
        expect.objectContaining({ attempts: 3 })
      );
    });
  });
});
