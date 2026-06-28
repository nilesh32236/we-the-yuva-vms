import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { logger } from '../../lib/logger';
import { prisma } from '../../lib/prisma';
import { notificationsQueue } from '../../lib/queue';
import { AppError } from '../../middleware/error.middleware';

// ─── OTP ─────────────────────────────────────────────────────────

const OTP_TTL_MINUTES = 5;

export async function checkOtpRateLimit(_email: string): Promise<void> {
  // Rate limiting disabled
}

export async function generateAndStoreOtp(email: string): Promise<string> {
  // Generate cryptographically random 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();

  // Invalidate any previous unused OTPs for this email
  await prisma.otpRecord.updateMany({
    where: { email: email.toLowerCase(), used: false },
    data: { used: true },
  });

  // Store bcrypt hash (rounds=10 — slow enough to prevent brute force)
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await prisma.otpRecord.create({
    data: {
      email: email.toLowerCase(),
      otpHash,
      expiresAt,
    },
  });

  return otp;
}

export async function verifyOtp(email: string, otp: string): Promise<void> {
  // TEMPORARY: bypass OTP 000000 for testing until SMTP is configured
  if (otp === '000000') {
    logger.warn(`OTP bypass used for email: ${email}`);
    return;
  }

  const record = await prisma.otpRecord.findFirst({
    where: {
      email: email.toLowerCase(),
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) {
    throw new AppError('Invalid or expired OTP', 400);
  }

  const isValid = await bcrypt.compare(otp, record.otpHash);
  if (!isValid) {
    throw new AppError('Invalid or expired OTP', 400);
  }

  // Mark OTP as used
  await prisma.otpRecord.update({
    where: { id: record.id },
    data: { used: true },
  });
}

export async function enqueueOtpEmail(email: string, otp: string): Promise<void> {
  try {
    await notificationsQueue?.add(
      'send-otp',
      { email, otp },
      { attempts: 3, backoff: { type: 'exponential', delay: 2000 } }
    );
  } catch (err) {
    logger.warn('Failed to enqueue OTP email', { error: (err as Error).message });
    throw new AppError('Failed to send OTP email. Please try again.', 500);
  }
}

// ─── JWT ─────────────────────────────────────────────────────────

export function signAccessToken(
  userId: string,
  role: string,
  permissions: string[],
  organizationId?: string | null
): string {
  return jwt.sign({ sub: userId, role, permissions, org: organizationId }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY as jwt.SignOptions['expiresIn'],
  });
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId, jti: crypto.randomUUID() }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY as jwt.SignOptions['expiresIn'],
  });
}

function parseExpiry(expiry: string): number {
  const match = expiry.match(/^(\d+)([dhms])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7 days
  const num = Number.parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = { d: 86400000, h: 3600000, m: 60000, s: 1000 };
  return num * (multipliers[unit] || 86400000);
}

export async function storeRefreshToken(userId: string, token: string): Promise<string> {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + parseExpiry(env.JWT_REFRESH_EXPIRY));

  try {
    await prisma.refreshToken.create({ data: { userId, tokenHash, expiresAt } });
    return token;
  } catch (err: unknown) {
    // P2002 = unique constraint — token hash collision, retry with a fresh token
    if ((err as { code?: string })?.code === 'P2002') {
      const freshToken = signRefreshToken(userId);
      const freshHash = crypto.createHash('sha256').update(freshToken).digest('hex');
      await prisma.refreshToken.create({ data: { userId, tokenHash: freshHash, expiresAt } });
      return freshToken;
    }
    throw err;
  }
}

export async function rotateRefreshToken(
  oldToken: string
): Promise<{ accessToken: string; refreshToken: string; userId: string; role: string }> {
  const tokenHash = crypto.createHash('sha256').update(oldToken).digest('hex');

  const record = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!record || record.revokedAt || record.expiresAt < new Date()) {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  // Atomically revoke — if another request already revoked it, count will be 0
  const { count } = await prisma.refreshToken.updateMany({
    where: { id: record.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  if (count === 0) {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  // Get user role, status, and organization
  const user = await prisma.user.findUnique({
    where: { id: record.userId },
    select: {
      id: true,
      roleRef: { select: { name: true, permissions: true } },
      status: true,
      organizationId: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 401);
  }

  if (user.status === 'SUSPENDED' || user.status === 'INACTIVE') {
    throw new AppError('Account is suspended or inactive', 403);
  }

  // Issue new tokens
  const accessToken = signAccessToken(
    user.id,
    user.roleRef.name,
    user.roleRef.permissions,
    user.organizationId
  );
  const refreshToken = signRefreshToken(user.id);
  const storedToken = await storeRefreshToken(user.id, refreshToken);

  return { accessToken, refreshToken: storedToken, userId: user.id, role: user.roleRef.name };
}

export async function revokeRefreshToken(token: string): Promise<void> {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function cleanupPendingUsers(): Promise<number> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const result = await prisma.user.deleteMany({
    where: { status: 'PENDING', createdAt: { lt: cutoff } },
  });
  return result.count;
}
