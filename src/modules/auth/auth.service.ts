import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { prisma } from '../../lib/prisma';
import { notificationsQueue } from '../../lib/queue';
import { redis } from '../../lib/redis';
import { AppError } from '../../middleware/error.middleware';

// ─── OTP ─────────────────────────────────────────────────────────

const OTP_TTL_MINUTES = 5;
const OTP_RATE_LIMIT = 3;
const OTP_RATE_WINDOW = 15 * 60; // 15 minutes in seconds

export async function checkOtpRateLimit(email: string): Promise<void> {
  if (!redis) return;
  const key = `otp:ratelimit:${email.toLowerCase()}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, OTP_RATE_WINDOW);
  }
  if (count > OTP_RATE_LIMIT) {
    throw new AppError('Too many OTP requests. Please wait before requesting another code.', 429);
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

export async function verifyOtp(email: string, otp: string): Promise<void> {
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
  await notificationsQueue?.add(
    'send-otp',
    { email, otp },
    { attempts: 3, backoff: { type: 'exponential', delay: 2000 } }
  ).catch(() => {});
}

// ─── JWT ─────────────────────────────────────────────────────────

export function signAccessToken(userId: string, role: string): string {
  return jwt.sign({ sub: userId, role }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY as jwt.SignOptions['expiresIn'],
  });
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId, jti: crypto.randomUUID() }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY as jwt.SignOptions['expiresIn'],
  });
}

export async function storeRefreshToken(userId: string, token: string): Promise<string> {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

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

  // Get user role
  const user = await prisma.user.findUnique({
    where: { id: record.userId },
    select: { id: true, role: true },
  });

  if (!user) {
    throw new AppError('User not found', 401);
  }

  // Issue new tokens
  const accessToken = signAccessToken(user.id, user.role);
  const refreshToken = signRefreshToken(user.id);
  const storedToken = await storeRefreshToken(user.id, refreshToken);

  return { accessToken, refreshToken: storedToken, userId: user.id, role: user.role };
}

export async function revokeRefreshToken(token: string): Promise<void> {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
