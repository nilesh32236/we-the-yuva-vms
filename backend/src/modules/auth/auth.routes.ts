import { type IRouter, Router } from 'express';
import type { Request } from 'express';
import rateLimit from 'express-rate-limit';
import { ConsentSchema, RegisterSchema, SendOtpSchema, VerifyOtpSchema } from '@/shared';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  logout,
  recordConsent,
  refresh,
  register,
  sendOtp,
  verifyOtpHandler,
} from './auth.controller';

export const authRouter: IRouter = Router();

function normalizeIp(ip: string | undefined): string {
  if (!ip) return 'unknown';
  // IPv4-mapped IPv6 (e.g. ::ffff:192.0.2.1) -> treat as IPv4
  if (ip.includes(':') && ip.includes('.')) {
    const v4 = ip.match(/(\d+\.\d+\.\d+\.\d+)$/)?.[1];
    if (v4) return v4;
  }
  if (ip.includes(':')) {
    // Normalize IPv6 to /56 subnet to prevent rotation within delegated prefix
    // Express-rate-limit 8.x ipKeyGenerator masks to /56; we replicate locally for 7.x
    let expanded = ip;
    if (ip.includes('::')) {
      const [head, tail] = ip.split('::');
      const headParts = head ? head.split(':').filter(Boolean) : [];
      const tailParts = tail ? tail.split(':').filter(Boolean) : [];
      const missing = 8 - headParts.length - tailParts.length;
      const zeros = Array(Math.max(0, missing)).fill('0');
      const full = [...headParts, ...zeros, ...tailParts];
      expanded = full.join(':');
    }
    const parts = expanded.split(':');
    // /56 = first 3 full hextets + high byte of 4th hextet
    // Simplified to first 4 hextets (/64) which still collapses common allocations;
    // using 3 hextets would be broader (/48). Use 4 to balance.
    return parts.slice(0, 4).join(':');
  }
  return ip;
}

function emailKey(req: Request): string {
  const email =
    typeof (req.body as { email?: unknown } | undefined)?.email === 'string'
      ? (req.body as { email: string }).email.toLowerCase()
      : 'unknown';
  return `${normalizeIp(req.ip)}:${email}`;
}

const sendOtpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  keyGenerator: (req) => `send-otp:${emailKey(req)}`,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many OTP requests. Please try again later.' },
});

const sendOtpIpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: (req) => `send-otp-ip:${normalizeIp(req.ip)}`,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many OTP requests from this device. Please try again later.' },
});

const verifyOtpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => `verify-otp:${emailKey(req)}`,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many verification attempts. Please try again later.' },
});

const verifyOtpIpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 25,
  keyGenerator: (req) => `verify-otp-ip:${normalizeIp(req.ip)}`,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many verification attempts from this device. Please try again later.' },
});

// Public routes
/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               whatsappNumber: { type: string }
 *               gender: { type: string, enum: [MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY] }
 *               dateOfBirth: { type: string, format: date }
 *     responses:
 *       201:
 *         description: User registered, OTP sent
 */
authRouter.post('/register', validate(RegisterSchema), register);

/**
 * @openapi
 * /auth/send-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Send OTP verification email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *     responses:
 *       200:
 *         description: OTP sent
 */
authRouter.post('/send-otp', sendOtpIpLimiter, sendOtpLimiter, validate(SendOtpSchema), sendOtp);

/**
 * @openapi
 * /auth/verify-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Verify OTP and login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               otp: { type: string }
 *     responses:
 *       200:
 *         description: Login successful, tokens set in cookies
 */
authRouter.post('/verify-otp', verifyOtpIpLimiter, verifyOtpLimiter, validate(VerifyOtpSchema), verifyOtpHandler);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     responses:
 *       200:
 *         description: Token refreshed
 */
authRouter.post('/refresh', refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout user
 *     responses:
 *       204:
 *         description: Logged out
 */
authRouter.post('/logout', requireAuth, logout);

// Protected routes
/**
 * @openapi
 * /auth/consent:
 *   post:
 *     tags: [Auth]
 *     summary: Record user consent
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               privacyPolicyAccepted: { type: boolean }
 *               mediaConsentAccepted: { type: boolean }
 *     responses:
 *       200:
 *         description: Consent recorded
 */
authRouter.post('/consent', requireAuth, validate(ConsentSchema), recordConsent);
