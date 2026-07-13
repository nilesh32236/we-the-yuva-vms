import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    pushSubscription: { upsert: vi.fn(), deleteMany: vi.fn(), findMany: vi.fn() },
    notification: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn() } }));
vi.mock('web-push', () => ({
  default: { sendNotification: vi.fn(), setVapidDetails: vi.fn() },
  sendNotification: vi.fn(),
  setVapidDetails: vi.fn(),
}));

const { prisma } = await import('@/lib/prisma');

import {
  deleteNotification,
  getNotification,
  getNotifications,
  getUnreadCount,
  markAllRead,
  markRead,
  sendPushToUser,
  subscribe,
  unsubscribe,
} from '../notifications.service';

describe('notifications.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('subscribe', () => {
    it('should upsert push subscription', async () => {
      vi.mocked(prisma.pushSubscription.upsert).mockResolvedValue({} as never);
      const result = await subscribe('user-1', {
        endpoint: 'https://end',
        keys: { p256dh: 'key', auth: 'auth' },
      });
      expect(result.ok).toBe(true);
    });
  });

  describe('unsubscribe', () => {
    it('should delete push subscription', async () => {
      vi.mocked(prisma.pushSubscription.deleteMany).mockResolvedValue({ count: 1 });
      const result = await unsubscribe('user-1', 'https://end');
      expect(result.ok).toBe(true);
    });
  });

  describe('sendPushToUser', () => {
    it('should send notification and push', async () => {
      vi.mocked(prisma.pushSubscription.findMany).mockResolvedValue([
        { endpoint: 'https://end', p256dh: 'key', auth: 'auth' },
      ] as never);
      vi.mocked(prisma.notification.create).mockResolvedValue({} as never);

      await sendPushToUser('user-1', 'Title', 'Body');
      expect(prisma.notification.create).toHaveBeenCalled();
    });

    it('should clean up subscription on push failure', async () => {
      // Need to mock the default export since source uses `import webpush from 'web-push'`
      const wpDefault = (await import('web-push')).default;
      vi.mocked(wpDefault.sendNotification).mockRejectedValue(new Error('gone'));
      vi.mocked(prisma.pushSubscription.findMany).mockResolvedValue([
        { endpoint: 'https://end', p256dh: 'key', auth: 'auth' },
      ] as never);
      vi.mocked(prisma.notification.create).mockResolvedValue({} as never);
      vi.mocked(prisma.pushSubscription.deleteMany).mockResolvedValue({ count: 1 });

      await sendPushToUser('user-1', 'Title', 'Body');
      expect(prisma.pushSubscription.deleteMany).toHaveBeenCalled();
    });
  });

  describe('getNotifications', () => {
    it('should return paginated notifications', async () => {
      vi.mocked(prisma.notification.findMany).mockResolvedValue([{ id: 'n1' }] as never);
      vi.mocked(prisma.notification.count).mockResolvedValue(1);
      const result = await getNotifications('user-1');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getNotification', () => {
    it('should throw 404 when not found', async () => {
      vi.mocked(prisma.notification.findFirst).mockResolvedValue(null);
      await expect(getNotification('user-1', 'bad-id')).rejects.toThrow('Notification not found');
    });

    it('should return notification', async () => {
      vi.mocked(prisma.notification.findFirst).mockResolvedValue({
        id: 'n1',
        title: 'Test',
      } as never);
      const result = await getNotification('user-1', 'n1');
      expect(result.title).toBe('Test');
    });
  });

  describe('deleteNotification', () => {
    it('should throw 404 when not found', async () => {
      vi.mocked(prisma.notification.delete).mockRejectedValue({ code: 'P2025' });
      await expect(deleteNotification('user-1', 'bad-id')).rejects.toThrow(
        'Notification not found'
      );
    });

    it('should delete notification', async () => {
      vi.mocked(prisma.notification.delete).mockResolvedValue({ id: 'n1' } as never);
      await expect(deleteNotification('user-1', 'n1')).resolves.toBeDefined();
    });
  });

  describe('markRead', () => {
    it('should throw 404 when not found', async () => {
      vi.mocked(prisma.notification.updateMany).mockResolvedValue({ count: 0 } as never);
      await expect(markRead('user-1', 'bad-id')).rejects.toThrow('Notification not found');
    });

    it('should mark as read', async () => {
      vi.mocked(prisma.notification.updateMany).mockResolvedValue({ count: 1 } as never);
      const result = await markRead('user-1', 'n1');
      expect(result.read).toBe(true);
    });
  });

  describe('markAllRead', () => {
    it('should mark all unread as read', async () => {
      vi.mocked(prisma.notification.updateMany).mockResolvedValue({ count: 3 });
      const result = await markAllRead('user-1');
      expect(result.ok).toBe(true);
    });
  });

  describe('getUnreadCount', () => {
    it('should return count', async () => {
      vi.mocked(prisma.notification.count).mockResolvedValue(5);
      const count = await getUnreadCount('user-1');
      expect(count).toBe(5);
    });
  });
});
