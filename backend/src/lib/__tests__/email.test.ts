import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendMail = vi.hoisted(() => vi.fn());

vi.mock('nodemailer', () => ({
  default: { createTransport: vi.fn(() => ({ sendMail })) },
  createTransport: vi.fn(() => ({ sendMail })),
}));

vi.mock('../../lib/logger', () => ({ logger: { warn: vi.fn() } }));

process.env.EMAIL_PROVIDER = 'smtp';
process.env.SMTP_HOST = 'smtp.test.com';
process.env.SMTP_USER = 'test-user';

const { sendEmail } = await import('../email');
const { logger } = await import('../../lib/logger');

describe('sendEmail (graceful SMTP failure)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not throw and should log a warning when sendMail rejects', async () => {
    sendMail.mockRejectedValueOnce(new Error('SMTP connection refused'));

    await expect(
      sendEmail('a@b.com', 'subject', '<p>html</p>', 'text')
    ).resolves.toBeUndefined();
    expect(logger.warn).toHaveBeenCalledWith(
      'Failed to send email',
      expect.objectContaining({ error: 'SMTP connection refused' })
    );
  });

  it('should resolve without warning when sendMail succeeds', async () => {
    sendMail.mockResolvedValueOnce({});

    await expect(
      sendEmail('a@b.com', 'subject', '<p>html</p>', 'text')
    ).resolves.toBeUndefined();
    expect(logger.warn).not.toHaveBeenCalled();
  });
});