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

describe('sendEmail (SMTP failure propagation)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw when sendMail rejects so BullMQ retries can re-run the job', async () => {
    sendMail.mockRejectedValueOnce(new Error('SMTP connection refused'));

    await expect(
      sendEmail('a@b.com', 'subject', '<p>html</p>', 'text')
    ).rejects.toThrow('SMTP connection refused');
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should resolve without warning when sendMail succeeds', async () => {
    sendMail.mockResolvedValueOnce({});

    await expect(
      sendEmail('a@b.com', 'subject', '<p>html</p>', 'text')
    ).resolves.toBeUndefined();
    expect(logger.warn).not.toHaveBeenCalled();
  });
});
