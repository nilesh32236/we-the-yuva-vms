import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.string().default('4000'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
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
  VAPID_PUBLIC_KEY: z
    .string()
    .default(
      'BDFh4qFJNvCz9GJvG2XsZGnx_7YMfJatM6DDSWCldXSM82-O8PH6_dJPIVH5uGq_Ym5PP7jq5V6klhIfZth_sVQ'
    ),
  VAPID_PRIVATE_KEY: z.string().default('z0JScxL4OQT5QyWj-gSBEHFgD-D1xTuQKHjW2LctWHY'),
  FRONTEND_URL: z.string(),
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

export const env = parsed.data;
export type Env = typeof env;
