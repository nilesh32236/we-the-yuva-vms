function emailShell(title: string, body: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#ECFDF5;font-family:'Open Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ECFDF5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:16px;border:1px solid #D1FAE5;overflow:hidden;">
          <tr>
            <td style="background-color:#047857;padding:32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;font-family:'Poppins',Arial,sans-serif;">WeTheYuva VMS</h1>
              <p style="margin:8px 0 0;color:#ffffff;font-size:14px;">Volunteer Management System</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px;">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="background-color:#F9FAFB;padding:20px 32px;border-top:1px solid #D1FAE5;">
              <p style="margin:0;color:#6B7280;font-size:12px;text-align:center;">© 2026 WeTheYuva. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

export function otpEmailTemplate(otp: string): string {
  return emailShell(
    'Your WeTheYuva Verification Code',
    `
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
    `
  );
}

export function applicationAcceptedTemplate(opportunityTitle: string): string {
  return emailShell(
    'Application Accepted',
    `
      <h2 style="margin:0 0 16px;color:#064E3B;font-size:20px;font-weight:600;font-family:'Poppins',Arial,sans-serif;">You've been accepted!</h2>
      <p style="margin:0 0 16px;color:#6B7280;font-size:15px;line-height:1.6;">
        Congratulations! Your application for <strong style="color:#047857;">${opportunityTitle}</strong> has been accepted.
      </p>
      <p style="margin:0;color:#6B7280;font-size:15px;line-height:1.6;">Log in to your dashboard to view upcoming events and get started.</p>
    `
  );
}

export function applicationRejectedTemplate(opportunityTitle: string): string {
  return emailShell(
    'Application Update',
    `
      <h2 style="margin:0 0 16px;color:#064E3B;font-size:20px;font-weight:600;font-family:'Poppins',Arial,sans-serif;">Application update</h2>
      <p style="margin:0 0 16px;color:#6B7280;font-size:15px;line-height:1.6;">
        Thank you for applying to <strong style="color:#047857;">${opportunityTitle}</strong>. Unfortunately, we are unable to move forward with your application at this time.
      </p>
      <p style="margin:0;color:#6B7280;font-size:15px;line-height:1.6;">
        We encourage you to explore other opportunities on the platform that match your skills and interests.
      </p>
    `
  );
}

export function eventInvitationTemplate(eventTitle: string, eventDate: string, venue?: string): string {
  return emailShell(
    'Event Invitation',
    `
      <h2 style="margin:0 0 16px;color:#064E3B;font-size:20px;font-weight:600;font-family:'Poppins',Arial,sans-serif;">You're invited!</h2>
      <p style="margin:0 0 16px;color:#6B7280;font-size:15px;line-height:1.6;">
        You have been invited to <strong style="color:#047857;">${eventTitle}</strong>.
      </p>
      <table cellpadding="0" cellspacing="0" style="background-color:#ECFDF5;border-radius:8px;padding:16px;margin-bottom:24px;width:100%;">
        <tr><td style="color:#064E3B;font-size:14px;padding:4px 0;"><strong>Date:</strong> ${eventDate}</td></tr>
        ${venue ? `<tr><td style="color:#064E3B;font-size:14px;padding:4px 0;"><strong>Venue:</strong> ${venue}</td></tr>` : ''}
      </table>
      <p style="margin:0;color:#6B7280;font-size:15px;line-height:1.6;">Log in to your dashboard to confirm your attendance.</p>
    `
  );
}

export function eventReminderTemplate(eventTitle: string, eventDate: string, venue?: string): string {
  return emailShell(
    'Event Reminder',
    `
      <h2 style="margin:0 0 16px;color:#064E3B;font-size:20px;font-weight:600;font-family:'Poppins',Arial,sans-serif;">Reminder: tomorrow's event</h2>
      <p style="margin:0 0 16px;color:#6B7280;font-size:15px;line-height:1.6;">
        This is a reminder that <strong style="color:#047857;">${eventTitle}</strong> is happening tomorrow.
      </p>
      <table cellpadding="0" cellspacing="0" style="background-color:#ECFDF5;border-radius:8px;padding:16px;margin-bottom:24px;width:100%;">
        <tr><td style="color:#064E3B;font-size:14px;padding:4px 0;"><strong>Date:</strong> ${eventDate}</td></tr>
        ${venue ? `<tr><td style="color:#064E3B;font-size:14px;padding:4px 0;"><strong>Venue:</strong> ${venue}</td></tr>` : ''}
      </table>
      <p style="margin:0;color:#6B7280;font-size:15px;line-height:1.6;">We look forward to seeing you there!</p>
    `
  );
}

export function accountSuspendedTemplate(): string {
  return emailShell(
    'Account Suspended',
    `
      <h2 style="margin:0 0 16px;color:#064E3B;font-size:20px;font-weight:600;font-family:'Poppins',Arial,sans-serif;">Account suspended</h2>
      <p style="margin:0 0 16px;color:#6B7280;font-size:15px;line-height:1.6;">
        Your WeTheYuva account has been suspended. You will not be able to log in until the suspension is lifted.
      </p>
      <p style="margin:0;color:#6B7280;font-size:15px;line-height:1.6;">
        If you believe this is a mistake, please contact our support team.
      </p>
    `
  );
}

export function newApplicationTemplate(volunteerName: string, opportunityTitle: string): string {
  return emailShell(
    'New Application',
    `
      <h2 style="margin:0 0 16px;color:#064E3B;font-size:20px;font-weight:600;font-family:'Poppins',Arial,sans-serif;">New application received</h2>
      <p style="margin:0 0 16px;color:#6B7280;font-size:15px;line-height:1.6;">
        ${volunteerName} applied to <strong style="color:#047857;">${opportunityTitle}</strong>.
      </p>
      <p style="margin:0;color:#6B7280;font-size:15px;line-height:1.6;">Log in to your dashboard to review the application.</p>
    `
  );
}
