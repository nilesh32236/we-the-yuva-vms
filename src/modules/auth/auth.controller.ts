import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { logAudit } from '../../lib/audit';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/error.middleware';
import {
  checkOtpRateLimit,
  enqueueOtpEmail,
  generateAndStoreOtp,
  revokeRefreshToken,
  rotateRefreshToken,
  signAccessToken,
  signRefreshToken,
  storeRefreshToken,
  verifyOtp,
} from './auth.service';

const isProd = process.env.NODE_ENV === 'production';

const ACCESS_COOKIE_OPTIONS = {
  httpOnly: false, // Must be readable by Next.js Edge middleware
  secure: isProd,
  sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/', // TODO: scope to /api/v1/auth/* in production
};

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, name, volunteerType } = req.body;

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      throw new AppError('Email already registered', 409);
    }

    const volunteerRole = await prisma.role.findUnique({ where: { name: 'VOLUNTEER' } });
    if (!volunteerRole) {
      throw new AppError('Default role not found — run seed first', 500);
    }

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        roleId: volunteerRole.id,
        status: 'PENDING',
        ...(volunteerType && { volunteerType }),
      },
    });

    await logAudit({
      userId: user.id,
      action: 'USER_CREATE',
      targetId: user.id,
      targetType: 'User',
    });

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

    // Check user exists
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      res.status(404).json({ error: 'No account found with this email address. Please check your email or create a new account.' });
      return;
    }

    await checkOtpRateLimit(email);
    const otp = await generateAndStoreOtp(email);
    await enqueueOtpEmail(email, otp);

    // TEMPORARY: return OTP for testing until SMTP is configured
    res.status(200).json({ message: 'Verification code sent to your email.', devOtp: otp });
  } catch (err) {
    next(err);
  }
}

export async function verifyOtpHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, otp } = req.body;

    await verifyOtp(email, otp);

    // Activate user on first verification
    const user = await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        email: true,
        roleRef: { select: { name: true, permissions: true } },
        status: true,
        locationId: true,
        organizationId: true,
        consent: { select: { id: true } },
        profile: { select: { id: true } },
        volunteerType: true,
      },
    });

    const accessToken = signAccessToken(
      user.id,
      user.roleRef.name,
      user.roleRef.permissions,
      user.organizationId
    );
    const refreshToken = signRefreshToken(user.id);
    await storeRefreshToken(user.id, refreshToken);

    await logAudit({ userId: user.id, action: 'LOGIN' });

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
    res.clearCookie('access_token', {
      path: '/',
      secure: isProd,
      sameSite: isProd ? 'none' : 'strict',
    });
    res.clearCookie('refresh_token', {
      path: '/',
      secure: isProd,
      sameSite: isProd ? 'none' : 'strict',
    });
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;
    if (refreshToken) {
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      const record = await prisma.refreshToken.findUnique({ where: { tokenHash } });
      if (record) {
        await logAudit({ userId: record.userId, action: 'LOGOUT' });
      }
      await revokeRefreshToken(refreshToken);
    }

    res.clearCookie('access_token', {
      path: '/',
      secure: isProd,
      sameSite: isProd ? 'none' : 'strict',
    });
    res.clearCookie('refresh_token', {
      path: '/',
      secure: isProd,
      sameSite: isProd ? 'none' : 'strict',
    });

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
