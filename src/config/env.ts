import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.string().default('4000'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().default('redis://127.0.0.1:6379'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  SMTP_FROM: z.string().email().default('noreply@example.com'),
  RESEND_API_KEY: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  VAPID_PUBLIC_KEY: z.string().optional().default(''),
  VAPID_PRIVATE_KEY: z.string().optional().default(''),
  FRONTEND_URL: z.string().min(1, 'FRONTEND_URL is required'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  const errors = parsed.error.flatten().fieldErrors;
  Object.entries(errors).forEach(([key, messages]) => {
    console.error(`  ${key}: ${messages?.join(', ')}`);
  });
  process.exit(1);
}

if (parsed.data.NODE_ENV !== 'test' && !parsed.data.VAPID_PUBLIC_KEY) {
  console.warn('⚠️  VAPID_PUBLIC_KEY is empty — web push notifications will fail at runtime');
}

if (parsed.data.NODE_ENV !== 'test' && !parsed.data.VAPID_PRIVATE_KEY) {
  console.warn('⚠️  VAPID_PRIVATE_KEY is empty — web push notifications will fail at runtime');
}

export const env = parsed.data;
export type Env = typeof env;
