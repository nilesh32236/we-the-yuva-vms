import { type Job, Worker } from 'bullmq';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import webpush from 'web-push';
import { env } from '../config/env';
import { logger } from '../lib/logger';
import { prisma } from '../lib/prisma';
import { notificationsQueue } from '../lib/queue';
import { redis } from '../lib/redis';

if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${env.SMTP_FROM || 'admin@wetheyuva.org'}`,
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY
  );
} else {
  logger.warn('VAPID keys not configured - push notifications disabled');
}

async function createInAppNotification(
  userId: string,
  title: string,
  body: string,
  link?: string,
  type?: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS'
) {
  try {
    await prisma.notification.create({ data: { userId, title, body, link, type: type ?? 'INFO' } });
  } catch (err) {
    logger.error('Failed to create in-app notification', { userId, error: (err as Error).message });
  }
}

// TODO: consult NotificationPreference before sending push in production
// Currently sends push to all subscribers regardless of user preferences
async function sendPushToUser(userId: string, title: string, body: string, link?: string) {
  try {
    const subs = await prisma.pushSubscription.findMany({ where: { userId } });
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title, body, link })
        );
      } catch (err) {
        logger.warn('Push subscription send failed, removing', { endpoint: sub.endpoint.slice(0, 30), error: (err as Error).message });
        await prisma.pushSubscription
          .deleteMany({ where: { endpoint: sub.endpoint } })
          .catch((cleanupErr) => logger.warn('Failed to clean up expired push subscription', { error: (cleanupErr as Error).message }));
      }
    }
  } catch (err) {
    logger.error('Failed to send push notification', { userId, error: (err as Error).message });
  }
}

// Use Resend SDK if API key is set (production), otherwise fall back to SMTP (local dev)
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

const smtpTransporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  connectionTimeout: 10000,
  socketTimeout: 15000,
  greetingTimeout: 10000,
});

async function sendEmail(to: string, subject: string, html: string, text: string) {
  if (resend) {
    const { error } = await resend.emails.send({
      from: env.SMTP_FROM,
      to,
      subject,
      html,
      text,
    });
    if (error) throw new Error(error.message);
  } else {
    await smtpTransporter.sendMail({
      from: `"WeTheYuva VMS" <${env.SMTP_FROM}>`,
      to,
      subject,
      html,
      text,
    });
  }
}

// ─── Email Templates ──────────────────────────────────────────────

function otpEmailTemplate(otp: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your WeTheYuva Verification Code</title>
</head>
<body style="margin:0;padding:0;background-color:#ECFDF5;font-family:'Open Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ECFDF5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:16px;border:1px solid #D1FAE5;overflow:hidden;">
          <tr>
            <td style="background-color:#059669;padding:32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;font-family:'Poppins',Arial,sans-serif;">WeTheYuva VMS</h1>
              <p style="margin:8px 0 0;color:#D1FAE5;font-size:14px;">Volunteer Management System</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px;">
              <h2 style="margin:0 0 16px;color:#064E3B;font-size:20px;font-weight:600;font-family:'Poppins',Arial,sans-serif;">Your verification code</h2>
              <p style="margin:0 0 32px;color:#6B7280;font-size:15px;line-height:1.6;">
                Use the code below to verify your email address. This code expires in <strong>5 minutes</strong>.
              </p>
              <div style="background-color:#ECFDF5;border:2px solid #059669;border-radius:12px;padding:24px;text-align:center;margin-bottom:32px;">
                <span style="font-size:40px;font-weight:700;letter-spacing:12px;color:#059669;font-family:'Poppins',Arial,sans-serif;">${otp}</span>
              </div>
              <p style="margin:0;color:#6B7280;font-size:13px;line-height:1.6;">
                If you didn't request this code, you can safely ignore this email. Never share this code with anyone.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#F9FAFB;padding:20px 32px;border-top:1px solid #D1FAE5;">
              <p style="margin:0;color:#9CA3AF;font-size:12px;text-align:center;">© 2026 WeTheYuva. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

function applicationAcceptedTemplate(opportunityTitle: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Accepted</title>
</head>
<body style="margin:0;padding:0;background-color:#ECFDF5;font-family:'Open Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ECFDF5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:16px;border:1px solid #D1FAE5;overflow:hidden;">
          <tr>
            <td style="background-color:#059669;padding:32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;font-family:'Poppins',Arial,sans-serif;">WeTheYuva VMS</h1>
              <p style="margin:8px 0 0;color:#D1FAE5;font-size:14px;">Volunteer Management System</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px;">
              <h2 style="margin:0 0 16px;color:#064E3B;font-size:20px;font-weight:600;font-family:'Poppins',Arial,sans-serif;">You've been accepted!</h2>
              <p style="margin:0 0 16px;color:#6B7280;font-size:15px;line-height:1.6;">
                Congratulations! Your application for <strong style="color:#059669;">${opportunityTitle}</strong> has been accepted.
              </p>
              <p style="margin:0;color:#6B7280;font-size:15px;line-height:1.6;">Log in to your dashboard to view upcoming events and get started.</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#F9FAFB;padding:20px 32px;border-top:1px solid #D1FAE5;">
              <p style="margin:0;color:#9CA3AF;font-size:12px;text-align:center;">© 2026 WeTheYuva. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

function applicationRejectedTemplate(opportunityTitle: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Update</title>
</head>
<body style="margin:0;padding:0;background-color:#ECFDF5;font-family:'Open Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ECFDF5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:16px;border:1px solid #D1FAE5;overflow:hidden;">
          <tr>
            <td style="background-color:#059669;padding:32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;font-family:'Poppins',Arial,sans-serif;">WeTheYuva VMS</h1>
              <p style="margin:8px 0 0;color:#D1FAE5;font-size:14px;">Volunteer Management System</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px;">
              <h2 style="margin:0 0 16px;color:#064E3B;font-size:20px;font-weight:600;font-family:'Poppins',Arial,sans-serif;">Application update</h2>
              <p style="margin:0 0 16px;color:#6B7280;font-size:15px;line-height:1.6;">
                Thank you for applying to <strong style="color:#059669;">${opportunityTitle}</strong>. Unfortunately, we are unable to move forward with your application at this time.
              </p>
              <p style="margin:0;color:#6B7280;font-size:15px;line-height:1.6;">
                We encourage you to explore other opportunities on the platform that match your skills and interests.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#F9FAFB;padding:20px 32px;border-top:1px solid #D1FAE5;">
              <p style="margin:0;color:#9CA3AF;font-size:12px;text-align:center;">© 2026 WeTheYuva. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

function eventInvitationTemplate(eventTitle: string, eventDate: string, venue?: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event Invitation</title>
</head>
<body style="margin:0;padding:0;background-color:#ECFDF5;font-family:'Open Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ECFDF5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:16px;border:1px solid #D1FAE5;overflow:hidden;">
          <tr>
            <td style="background-color:#059669;padding:32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;font-family:'Poppins',Arial,sans-serif;">WeTheYuva VMS</h1>
              <p style="margin:8px 0 0;color:#D1FAE5;font-size:14px;">Volunteer Management System</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px;">
              <h2 style="margin:0 0 16px;color:#064E3B;font-size:20px;font-weight:600;font-family:'Poppins',Arial,sans-serif;">You're invited!</h2>
              <p style="margin:0 0 16px;color:#6B7280;font-size:15px;line-height:1.6;">
                You have been invited to <strong style="color:#059669;">${eventTitle}</strong>.
              </p>
              <table cellpadding="0" cellspacing="0" style="background-color:#ECFDF5;border-radius:8px;padding:16px;margin-bottom:24px;width:100%;">
                <tr><td style="color:#064E3B;font-size:14px;padding:4px 0;"><strong>Date:</strong> ${eventDate}</td></tr>
                ${venue ? `<tr><td style="color:#064E3B;font-size:14px;padding:4px 0;"><strong>Venue:</strong> ${venue}</td></tr>` : ''}
              </table>
              <p style="margin:0;color:#6B7280;font-size:15px;line-height:1.6;">Log in to your dashboard to confirm your attendance.</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#F9FAFB;padding:20px 32px;border-top:1px solid #D1FAE5;">
              <p style="margin:0;color:#9CA3AF;font-size:12px;text-align:center;">© 2026 WeTheYuva. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

function eventReminderTemplate(eventTitle: string, eventDate: string, venue?: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event Reminder</title>
</head>
<body style="margin:0;padding:0;background-color:#ECFDF5;font-family:'Open Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ECFDF5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:16px;border:1px solid #D1FAE5;overflow:hidden;">
          <tr>
            <td style="background-color:#059669;padding:32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;font-family:'Poppins',Arial,sans-serif;">WeTheYuva VMS</h1>
              <p style="margin:8px 0 0;color:#D1FAE5;font-size:14px;">Volunteer Management System</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px;">
              <h2 style="margin:0 0 16px;color:#064E3B;font-size:20px;font-weight:600;font-family:'Poppins',Arial,sans-serif;">Reminder: tomorrow's event</h2>
              <p style="margin:0 0 16px;color:#6B7280;font-size:15px;line-height:1.6;">
                This is a reminder that <strong style="color:#059669;">${eventTitle}</strong> is happening tomorrow.
              </p>
              <table cellpadding="0" cellspacing="0" style="background-color:#ECFDF5;border-radius:8px;padding:16px;margin-bottom:24px;width:100%;">
                <tr><td style="color:#064E3B;font-size:14px;padding:4px 0;"><strong>Date:</strong> ${eventDate}</td></tr>
                ${venue ? `<tr><td style="color:#064E3B;font-size:14px;padding:4px 0;"><strong>Venue:</strong> ${venue}</td></tr>` : ''}
              </table>
              <p style="margin:0;color:#6B7280;font-size:15px;line-height:1.6;">We look forward to seeing you there!</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#F9FAFB;padding:20px 32px;border-top:1px solid #D1FAE5;">
              <p style="margin:0;color:#9CA3AF;font-size:12px;text-align:center;">© 2026 WeTheYuva. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

function accountSuspendedTemplate(): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Suspended</title>
</head>
<body style="margin:0;padding:0;background-color:#ECFDF5;font-family:'Open Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ECFDF5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:16px;border:1px solid #D1FAE5;overflow:hidden;">
          <tr>
            <td style="background-color:#059669;padding:32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;font-family:'Poppins',Arial,sans-serif;">WeTheYuva VMS</h1>
              <p style="margin:8px 0 0;color:#D1FAE5;font-size:14px;">Volunteer Management System</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px;">
              <h2 style="margin:0 0 16px;color:#064E3B;font-size:20px;font-weight:600;font-family:'Poppins',Arial,sans-serif;">Account suspended</h2>
              <p style="margin:0 0 16px;color:#6B7280;font-size:15px;line-height:1.6;">
                Your WeTheYuva account has been suspended. You will not be able to log in until the suspension is lifted.
              </p>
              <p style="margin:0;color:#6B7280;font-size:15px;line-height:1.6;">
                If you believe this is a mistake, please contact our support team.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#F9FAFB;padding:20px 32px;border-top:1px solid #D1FAE5;">
              <p style="margin:0;color:#9CA3AF;font-size:12px;text-align:center;">© 2026 WeTheYuva. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

// ─── Worker ───────────────────────────────────────────────────────

export let notificationWorker: Worker | null = null;

if (redis && notificationsQueue) {
  notificationWorker = new Worker(
    'notifications',
    async (job: Job) => {
      if (job.name === 'send-otp') {
        const { email, otp } = job.data as { email: string; otp: string };

        await sendEmail(
          email,
          'Your WeTheYuva verification code',
          otpEmailTemplate(otp),
          `Your WeTheYuva verification code is: ${otp}\n\nThis code expires in 5 minutes.`
        );

        logger.info('OTP email sent', { email, jobId: job.id });
      }

      if (job.name === 'application-accepted') {
        const { volunteerId, opportunityTitle } = job.data as {
          volunteerId: string;
          opportunityTitle: string;
          opportunityId: string;
        };

        const user = await prisma.user.findUnique({
          where: { id: volunteerId },
          select: { email: true },
        });
        if (!user?.email) return;

        await sendEmail(
          user.email,
          `You've been accepted — ${opportunityTitle}`,
          applicationAcceptedTemplate(opportunityTitle),
          `Congratulations! Your application for "${opportunityTitle}" has been accepted.`
        );

        await createInAppNotification(
          volunteerId,
          'Application Accepted',
          `Your application for "${opportunityTitle}" has been accepted!`,
          undefined,
          'SUCCESS'
        );
        await sendPushToUser(
          volunteerId,
          'Application Accepted',
          `Your application for "${opportunityTitle}" has been accepted!`
        );

        logger.info('Application accepted email sent', { volunteerId, jobId: job.id });
      }

      if (job.name === 'application-rejected') {
        const { volunteerId, opportunityTitle } = job.data as {
          volunteerId: string;
          opportunityTitle: string;
        };

        const user = await prisma.user.findUnique({
          where: { id: volunteerId },
          select: { email: true },
        });
        if (!user?.email) return;

        await sendEmail(
          user.email,
          `Application update — ${opportunityTitle}`,
          applicationRejectedTemplate(opportunityTitle),
          `Thank you for applying to "${opportunityTitle}". Unfortunately, we are unable to move forward with your application at this time.`
        );

        await createInAppNotification(
          volunteerId,
          'Application Update',
          `Your application for "${opportunityTitle}" was not accepted.`,
          undefined,
          'INFO'
        );
        await sendPushToUser(
          volunteerId,
          'Application Update',
          `Your application for "${opportunityTitle}" was not accepted.`
        );

        logger.info('Application rejected email sent', { volunteerId, jobId: job.id });
      }

      if (job.name === 'event-invitation') {
        const { volunteerId, eventTitle, eventDate, venue } = job.data as {
          volunteerId: string;
          eventId: string;
          eventTitle: string;
          eventDate: string;
          venue?: string;
        };

        const user = await prisma.user.findUnique({
          where: { id: volunteerId },
          select: { email: true },
        });
        if (!user?.email) return;

        await sendEmail(
          user.email,
          `You're invited — ${eventTitle}`,
          eventInvitationTemplate(eventTitle, eventDate, venue),
          `You have been invited to "${eventTitle}" on ${eventDate}${venue ? ` at ${venue}` : ''}.`
        );

        await createInAppNotification(
          volunteerId,
          'Event Invitation',
          `You're invited to "${eventTitle}"!`,
          undefined,
          'INFO'
        );
        await sendPushToUser(volunteerId, 'Event Invitation', `You're invited to "${eventTitle}"!`);

        logger.info('Event invitation email sent', { volunteerId, jobId: job.id });
      }

      if (job.name === 'event-reminder') {
        const { volunteerId, eventTitle, eventDate, venue } = job.data as {
          volunteerId: string;
          eventId: string;
          eventTitle: string;
          eventDate: string;
          venue?: string;
        };

        const user = await prisma.user.findUnique({
          where: { id: volunteerId },
          select: { email: true },
        });
        if (!user?.email) return;

        await sendEmail(
          user.email,
          `Reminder: ${eventTitle} is tomorrow`,
          eventReminderTemplate(eventTitle, eventDate, venue),
          `Reminder: "${eventTitle}" is happening tomorrow on ${eventDate}${venue ? ` at ${venue}` : ''}.`
        );

        await createInAppNotification(
          volunteerId,
          'Event Reminder',
          `"${eventTitle}" is happening tomorrow!`,
          undefined,
          'INFO'
        );
        await sendPushToUser(
          volunteerId,
          'Event Reminder',
          `"${eventTitle}" is happening tomorrow!`
        );

        logger.info('Event reminder email sent', { volunteerId, jobId: job.id });
      }

      if (job.name === 'account-suspended') {
        const { userId, email } = job.data as { userId: string; email: string };
        if (!email) return;

        await sendEmail(
          email,
          'Your WeTheYuva account has been suspended',
          accountSuspendedTemplate(),
          'Your WeTheYuva account has been suspended. If you believe this is a mistake, please contact our support team.'
        );

        if (userId) {
          await createInAppNotification(
            userId,
            'Account Suspended',
            'Your account has been suspended. Please contact support.',
            undefined,
            'WARNING'
          );
          await sendPushToUser(userId, 'Account Suspended', 'Your account has been suspended.');
        }

        logger.info('Account suspended email sent', { email, jobId: job.id });
      }

      if (job.name === 'match-alert-subscriptions') {
        const { opportunityId } = job.data as { opportunityId: string };

        const opportunity = await prisma.opportunity.findUnique({
          where: { id: opportunityId },
          select: { title: true, category: true, skills: true },
        });
        if (!opportunity) return;

        const subscriptions = await prisma.alertSubscription.findMany({
          where: {
            isActive: true,
            OR: [
              { categories: { has: opportunity.category } },
              { skills: { hasSome: opportunity.skills } },
            ],
          },
          select: { userId: true },
        });

        for (const sub of subscriptions) {
          await createInAppNotification(
            sub.userId,
            'New Opportunity Match',
            `"${opportunity.title}" matches your alert preferences!`,
            `/volunteer/opportunities/${opportunityId}`,
            'INFO'
          );
        }

        logger.info('Alert subscriptions matched', {
          opportunityId,
          matches: subscriptions.length,
          jobId: job.id,
        });
      }

      if (job.name === 'clean-expired-qr-tokens') {
        const now = new Date();
        const result = await prisma.event.updateMany({
          where: { qrExpiresAt: { lt: now }, qrToken: { not: null } },
          data: { qrToken: null, qrExpiresAt: null },
        });

        logger.info('Expired QR tokens cleaned', { count: result.count, jobId: job.id });
      }

      if (job.name === 'daily-metrics-snapshot') {
        const [
          totalUsers,
          activeVolunteers,
          totalHoursResult,
          activeOpportunities,
          scheduledEvents,
        ] = await Promise.all([
          prisma.user.count(),
          prisma.user.count({ where: { role: 'VOLUNTEER', status: 'ACTIVE' } }),
          prisma.volunteerProfile.aggregate({ _sum: { totalHours: true } }),
          prisma.opportunity.count({ where: { status: 'ACTIVE' } }),
          prisma.event.count({ where: { status: 'SCHEDULED', eventDate: { gte: new Date() } } }),
        ]);

        logger.info('Daily metrics snapshot', {
          date: new Date().toISOString().slice(0, 10),
          totalUsers,
          activeVolunteers,
          totalHours: totalHoursResult._sum.totalHours ?? 0,
          activeOpportunities,
          scheduledEvents,
        });
      }

      if (job.name === 'check-event-reminders') {
        const now = new Date();
        const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // Find all SCHEDULED events within the next 24 hours
        const upcomingEvents = await prisma.event.findMany({
          where: {
            eventDate: { gte: now, lte: in24h },
            status: 'SCHEDULED',
          },
          take: 100,
        });

        for (const event of upcomingEvents) {
          // Find all volunteers with ACCEPTED applications for this event's opportunity
          const acceptedApplications = await prisma.application.findMany({
            where: {
              opportunityId: event.opportunityId,
              status: 'ACCEPTED',
            },
            select: { volunteerId: true },
          });

          for (const { volunteerId } of acceptedApplications) {
            await notificationsQueue?.add(
              'event-reminder',
              {
                volunteerId,
                eventId: event.id,
                eventTitle: event.title,
                eventDate: event.eventDate.toISOString(),
                venue: event.venue ?? undefined,
              },
              {
                // Deduplicate: same event+volunteer pair won't be enqueued twice
                jobId: `event-reminder-${event.id}-${volunteerId}`,
              }
            );
          }
        }

        logger.info('Event reminders enqueued', {
          eventsChecked: upcomingEvents.length,
          jobId: job.id,
        });
      }
    },
    {
      connection: redis,
      concurrency: 5,
      lockDuration: 60000,
    }
  );

  notificationWorker.on('completed', (job) => {
    logger.debug('Notification job completed', { jobId: job.id, name: job.name });
  });

  notificationWorker.on('failed', (job, err) => {
    logger.error('Notification job failed', {
      jobId: job?.id,
      name: job?.name,
      email: job?.data?.email,
      error: err.message,
      attempts: job?.attemptsMade,
    });
  });
} else {
  logger.warn('BullMQ worker not started — Redis unavailable');
}
