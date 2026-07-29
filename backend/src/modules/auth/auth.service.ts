import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { sendEmail } from '../../lib/email';
import { logger } from '../../lib/logger';
import { prisma } from '../../lib/prisma';
import { redis } from '../../lib/redis';
import { notificationsQueue } from '../../lib/queue';
import { AppError } from '../../middleware/error.middleware';

// ─── OTP ─────────────────────────────────────────────────────────

const OTP_TTL_MINUTES = 5;
const OTP_RATE_LIMIT = 3;
const OTP_RATE_WINDOW_SEC = 60;
const OTP_FAIL_LIMIT = 5;
const OTP_FAIL_WINDOW_SEC = 900; // 15 minutes

// In-memory fallback for OTP rate limiting (used when Redis is unavailable)
const otpRateMap = new Map<string, { count: number; resetAt: number }>();

export async function checkOtpRateLimit(email: string): Promise<void> {
  const key = `otp:rate:${email.toLowerCase()}`;
  if (redis) {
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, OTP_RATE_WINDOW_SEC);
    if (count > OTP_RATE_LIMIT) {
      throw new AppError('Too many OTP requests. Please try again later.', 429);
    }
  } else {
    // Fallback to in-memory when Redis is unavailable
    const fallback = otpRateMap.get(email);
    const now = Date.now();
    if (!fallback || now > fallback.resetAt) {
      otpRateMap.set(email, { count: 1, resetAt: now + OTP_RATE_WINDOW_SEC * 1000 });
    } else if (fallback.count >= OTP_RATE_LIMIT) {
      throw new AppError('Too many OTP requests. Please try again later.', 429);
    } else {
      fallback.count++;
    }
  }
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

const otpFailMap = new Map<string, { count: number; resetAt: number }>();

export async function verifyOtp(email: string, otp: string): Promise<void> {
  const emailKey = email.toLowerCase();
  const failKey = `otp:fail:${emailKey}`;

  if (redis) {
    const failCount = await redis.get(failKey);
    if (failCount && Number(failCount) >= OTP_FAIL_LIMIT) {
      throw new AppError('Too many failed attempts. Please try again later.', 429);
    }
  } else {
    const failEntry = otpFailMap.get(emailKey);
    if (failEntry && Date.now() < failEntry.resetAt && failEntry.count >= OTP_FAIL_LIMIT) {
      throw new AppError('Too many failed attempts. Please try again later.', 429);
    }
  }

  const record = await prisma.otpRecord.findFirst({
    where: {
      email: emailKey,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) {
    await recordFailedAttempt(emailKey, failKey);
    throw new AppError('Invalid or expired OTP', 400);
  }

  const isValid = await bcrypt.compare(otp, record.otpHash);
  if (!isValid) {
    await recordFailedAttempt(emailKey, failKey);
    throw new AppError('Invalid or expired OTP', 400);
  }

  // Clear failed attempts on success
  if (redis) {
    await redis.del(failKey);
  } else {
    otpFailMap.delete(emailKey);
  }

  // Mark OTP as used
  await prisma.otpRecord.update({
    where: { id: record.id },
    data: { used: true },
  });
}

async function recordFailedAttempt(emailKey: string, failKey: string): Promise<void> {
  if (redis) {
    const count = await redis.incr(failKey);
    if (count === 1) await redis.expire(failKey, OTP_FAIL_WINDOW_SEC);
  } else {
    const now = Date.now();
    const entry = otpFailMap.get(emailKey);
    if (!entry || now > entry.resetAt) {
      otpFailMap.set(emailKey, { count: 1, resetAt: now + OTP_FAIL_WINDOW_SEC * 1000 });
    } else {
      entry.count++;
    }
  }
}

export async function enqueueOtpEmail(email: string, otp: string): Promise<void> {
  if (notificationsQueue) {
    try {
      await notificationsQueue.add(
        'send-otp',
        { email, otp },
        { attempts: 3, backoff: { type: 'exponential', delay: 2000 } }
      );
      return;
    } catch (err) {
      logger.warn('Failed to enqueue OTP email, trying direct send', {
        error: (err as Error).message,
      });
    }
  }

  // Fallback: send directly when queue is unavailable
  try {
    await sendEmail(
      email,
      'Your WeTheYuva verification code',
      `<h1>Your verification code</h1><p style="font-size:32px;letter-spacing:8px;font-weight:bold;">${otp}</p><p>This code expires in 5 minutes.</p>`,
      `Your WeTheYuva verification code is: ${otp}\n\nThis code expires in 5 minutes.`
    );
  } catch (err) {
    // Non-blocking: log the failure but don't throw.
    // devOtp in the response allows testing without SMTP.
    logger.warn('Failed to send OTP email (SMTP not configured)', { error: (err as Error).message });
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
    issuer: 'we-the-yuva-api',
  });
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId, jti: crypto.randomUUID() }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY as jwt.SignOptions['expiresIn'],
    issuer: 'we-the-yuva-api',
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

  if (user.status === 'SUSPENDED' || user.status === 'INACTIVE' || user.status === 'PENDING') {
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

export async function lookupReferral(
  reference: string
): Promise<{ id: string; name: string } | null> {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ phone: reference }, { referralCode: reference }],
      status: { not: 'PENDING' },
    },
    select: { id: true, name: true },
  });
  return user;
}

export async function cleanupPendingUsers(): Promise<number> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const result = await prisma.user.deleteMany({
    where: { status: 'PENDING', createdAt: { lt: cutoff } },
  });
  return result.count;
}
