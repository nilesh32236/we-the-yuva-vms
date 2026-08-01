import { describe, expect, it } from 'vitest';
import {
  accountSuspendedTemplate,
  applicationAcceptedTemplate,
  applicationRejectedTemplate,
  eventInvitationTemplate,
  eventReminderTemplate,
  newApplicationTemplate,
  otpEmailTemplate,
} from '../email-templates';

const templates = {
  otp: otpEmailTemplate('123456'),
  accepted: applicationAcceptedTemplate('River Cleanup'),
  rejected: applicationRejectedTemplate('River Cleanup'),
  invitation: eventInvitationTemplate('River Cleanup', 'Aug 10, 2026', 'City Park'),
  reminder: eventReminderTemplate('River Cleanup', 'Aug 10, 2026'),
  suspended: accountSuspendedTemplate(),
  newApplication: newApplicationTemplate('Jane Doe', 'River Cleanup'),
};

describe('email templates', () => {
  for (const [name, html] of Object.entries(templates)) {
    describe(name, () => {
      it('is a full HTML document with lang and charset', () => {
        expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
        expect(html).toContain('<html lang="en">');
        expect(html).toContain('<meta charset="UTF-8">');
      });

      it('uses the AA-contrast header background', () => {
        expect(html).toContain('background-color:#047857');
      });

      it('uses white for the header subtitle', () => {
        expect(html).toContain('margin:8px 0 0;color:#ffffff');
      });

      it('uses AA-contrast footer text', () => {
        expect(html).toContain('color:#6B7280;font-size:12px');
      });

      it('does not use the low-contrast colors', () => {
        expect(html).not.toContain('background-color:#059669;padding:32px');
        expect(html).not.toContain('color:#D1FAE5');
        expect(html).not.toContain('color:#9CA3AF');
      });
    });
  }

  it('escapes the OTP in the otp template', () => {
    const html = otpEmailTemplate('654321');
    expect(html).toContain('>654321</span>');
  });

  it('renders venue conditionally in event templates', () => {
    expect(eventInvitationTemplate('E', 'date')).not.toContain('Venue');
    expect(eventInvitationTemplate('E', 'date', 'Hall')).toContain('Hall');
    expect(eventReminderTemplate('E', 'date')).not.toContain('Venue');
    expect(eventReminderTemplate('E', 'date', 'Hall')).toContain('Hall');
  });

  it('renders volunteer and opportunity names in the new-application template', () => {
    const html = newApplicationTemplate('Jane Doe', 'River Cleanup');
    expect(html).toContain('Jane Doe applied to');
    expect(html).toContain('River Cleanup');
  });
});
