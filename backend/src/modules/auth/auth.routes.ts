import { type IRouter, Router } from 'express';
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

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many accounts created from this IP, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  message: { error: 'Too many OTP requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
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
 *               phone: { type: string }
 *     responses:
 *       201:
 *         description: User registered, OTP sent
 */
authRouter.post('/register', registerLimiter, validate(RegisterSchema), register);

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
authRouter.post('/send-otp', otpLimiter, validate(SendOtpSchema), sendOtp);

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
authRouter.post('/verify-otp', otpLimiter, validate(VerifyOtpSchema), verifyOtpHandler);

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
const refreshLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many refresh requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

authRouter.post('/refresh', refreshLimiter, refresh);

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
