import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { logAudit } from '../../lib/audit';
import { logger } from '../../lib/logger';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/error.middleware';
import {
  checkOtpRateLimit,
  enqueueOtpEmail,
  generateAndStoreOtp,
  lookupReferral,
  revokeRefreshToken,
  rotateRefreshToken,
  signAccessToken,
  signRefreshToken,
  storeRefreshToken,
  verifyOtp,
} from './auth.service';

const isProd = process.env.NODE_ENV === 'production';

const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 15 * 60 * 1000, // 15 minutes
  path: '/',
};

const CLEAR_COOKIE_OPTIONS = {
  path: '/',
  secure: isProd,
  sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
};

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/v1/auth',
};

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      email,
      name,
      role,
      phone,
      dateOfBirth,
      address,
      reference,
      callAvailability,
      whyVoluntary,
    } = req.body;
    const sanitizedName = name?.trim().replace(/<[^>]*>/g, '');

    const roleName = role ?? 'VOLUNTEER';
    const roleRecord = await prisma.role.findUnique({ where: { name: roleName } });
    if (!roleRecord) throw new AppError(`Invalid role: ${roleName}`, 500);

    let referredById: string | undefined;
    if (reference) {
      const referrer = await lookupReferral(reference);
      if (referrer) {
        referredById = referrer.id;
      }
    }

    const user = await prisma.user
      .create({
        data: {
          email: email.toLowerCase(),
          name: sanitizedName,
          roleId: roleRecord.id,
          status: 'PENDING',
          phone,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          address,
          ...(referredById && { referredById }),
          callAvailability,
          whyVoluntary,
        },
      })
      .catch((err: unknown) => {
        const prismaErr = err as { code?: string; meta?: { target?: string[] } };
        if (prismaErr.code === 'P2002') {
          const field = prismaErr.meta?.target?.[0] ?? 'Field';
          throw new AppError(`${field.charAt(0).toUpperCase() + field.slice(1)} already in use`, 409);
        }
        throw err;
      });

    logAudit({
      userId: user.id,
      action: 'USER_CREATE',
      targetId: user.id,
      targetType: 'User',
    }).catch((err) => logger.warn('Audit log failed', { error: (err as Error).message }));

    res
      .status(201)
      .json({ userId: user.id, message: 'Account created. Please verify your email.' });
  } catch (err) {
    next(err);
  }
}

export async function sendOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, status: true },
    });
    if (!user) {
      // Don't reveal whether email exists
      res.status(200).json({ message: 'Verification code sent to your email.' });
      return;
    }

    if (user.status === 'SUSPENDED' || user.status === 'INACTIVE') {
      throw new AppError('Account is suspended or inactive', 403);
    }

    await checkOtpRateLimit(email);
    const otp = await generateAndStoreOtp(email);
    enqueueOtpEmail(email, otp).catch((err) =>
      logger.warn('Failed to send OTP email', { error: (err as Error).message })
    );
    logAudit({ userId: user.id, action: 'OTP_SENT' }).catch((err) =>
      logger.warn('Audit log failed', { error: (err as Error).message })
    );

    res.status(200).json({
      message: 'Verification code sent to your email.',
      ...(process.env.NODE_ENV !== 'production' && { devOtp: otp }),
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyOtpHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, otp } = req.body;

    await verifyOtp(email, otp);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        roleRef: { select: { name: true, permissions: true } },
        locationId: true,
        organizationId: true,
        consent: { select: { id: true } },
        profile: { select: { id: true } },
        volunteerType: true,
      },
    });
    if (!user) throw new AppError('User not found', 404);
    if (user.status === 'SUSPENDED' || user.status === 'INACTIVE') {
      throw new AppError('Account is suspended or inactive', 403);
    }

    if (user.status === 'PENDING') {
      await prisma.user.update({
        where: { email: email.toLowerCase() },
        data: { status: 'ACTIVE' },
      });
      user.status = 'ACTIVE';
    }

    const accessToken = signAccessToken(
      user.id,
      user.roleRef.name,
      user.roleRef.permissions,
      user.organizationId
    );
    const refreshToken = signRefreshToken(user.id);
    await storeRefreshToken(user.id, refreshToken);

    await prisma.auditLog.createMany({
      data: [
        { userId: user.id, action: 'LOGIN' },
        { userId: user.id, action: 'OTP_VERIFIED' },
      ],
    }).catch((err) => logger.warn('Audit log failed', { error: (err as Error).message }));

    // Set cookies
    res.cookie('access_token', accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);

    res.status(200).json({
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.roleRef.name,
        status: user.status,
        locationId: user.locationId,
        consent: user.consent,
        profile: user.profile,
        volunteerType: user.volunteerType,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const oldRefreshToken = req.cookies?.refresh_token;

    if (!oldRefreshToken) {
      throw new AppError('No refresh token', 401);
    }

    const { accessToken, refreshToken } = await rotateRefreshToken(oldRefreshToken);

    res.cookie('access_token', accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);

    res.status(200).json({ accessToken });
  } catch (err) {
    // Clear cookies on failure
    res.clearCookie('access_token', CLEAR_COOKIE_OPTIONS);
    res.clearCookie('refresh_token', CLEAR_COOKIE_OPTIONS);
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.cookies?.refresh_token;
    if (refreshToken) {
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      const record = await prisma.refreshToken.findUnique({
        where: { tokenHash },
        select: { userId: true },
      });
      if (record) {
        await logAudit({ userId: record.userId, action: 'LOGOUT' });
      }
      await revokeRefreshToken(refreshToken);
    }

    res.clearCookie('access_token', CLEAR_COOKIE_OPTIONS);
    res.clearCookie('refresh_token', CLEAR_COOKIE_OPTIONS);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function recordConsent(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { privacyPolicyAccepted, mediaConsentAccepted } = req.body;

    if (!privacyPolicyAccepted) {
      throw new AppError('Privacy policy acceptance is required to use this platform', 400);
    }

    const existing = await prisma.consentRecord.findUnique({ where: { userId } });
    if (existing) {
      throw new AppError('Consent already recorded', 409);
    }

    await prisma.consentRecord.create({
      data: { userId, privacyPolicyAccepted, mediaConsentAccepted },
    });

    await logAudit({
      userId,
      action: 'SYSTEM',
      targetId: userId,
      targetType: 'User',
      metadata: { consent: 'recorded', privacyPolicyAccepted, mediaConsentAccepted },
    });

    res.status(201).json({ message: 'Consent recorded successfully.' });
  } catch (err) {
    next(err);
  }
}
