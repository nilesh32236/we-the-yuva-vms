import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { env } from '../config/env';
import { logger } from './logger';

let resend: Resend | null = null;
let smtpTransporter: nodemailer.Transporter | null = null;

const provider = env.EMAIL_PROVIDER;

if (provider === 'resend') {
  if (env.RESEND_API_KEY) {
    resend = new Resend(env.RESEND_API_KEY);
  } else {
    logger.warn(
      'EMAIL_PROVIDER is "resend" but RESEND_API_KEY is not set — email sending disabled'
    );
  }
} else {
  if (env.SMTP_HOST && env.SMTP_USER) {
    smtpTransporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      connectionTimeout: 10000,
      socketTimeout: 15000,
      greetingTimeout: 10000,
    });
  } else {
    logger.warn('SMTP not configured (SMTP_HOST/SMTP_USER) — email sending disabled');
  }
}

// True when a real email transport (Resend or SMTP) is configured. Used to
// switch between real email delivery and the Dev OTP fallback.
export const emailEnabled =
  (provider === 'resend' && !!resend) || (provider === 'smtp' && !!smtpTransporter);

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<void> {
  try {
    if (provider === 'resend') {
      if (!resend) {
        logger.warn('Cannot send email: Resend not initialized');
        return;
      }
      const { error } = await resend.emails.send({
        from: env.SMTP_FROM,
        to,
        subject,
        html,
        text,
      });
      if (error) throw new Error(error.message);
    } else {
      if (!smtpTransporter) {
        logger.warn('Cannot send email: SMTP not initialized');
        return;
      }
      await smtpTransporter.sendMail({
        from: `"WeTheYuva VMS" <${env.SMTP_FROM}>`,
        to,
        subject,
        html,
        text,
      });
    }
  } catch (err) {
    // Never throw: email delivery is best-effort. On HF Spaces SMTP is often
    // unconfigured, so failure is expected and must not break the request flow.
    logger.warn('Failed to send email', { to, subject, error: (err as Error).message });
  }
}
