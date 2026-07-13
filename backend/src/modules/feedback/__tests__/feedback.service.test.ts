import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    event: { findUnique: vi.fn() },
    attendance: { findUnique: vi.fn() },
    eventFeedback: {
      findUnique: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

const { prisma } = await import('@/lib/prisma');

import {
  deleteFeedback,
  getEventFeedback,
  getEventFeedbackSummary,
  getMyFeedback,
  submitFeedback,
  updateFeedback,
} from '../feedback.service';

describe('feedback.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('submitFeedback', () => {
    it('should throw 404 when event not found', async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValue(null);
      await expect(submitFeedback('evt-1', 'user-1', { rating: 5 })).rejects.toThrow(
        'Event not found'
      );
    });

    it('should throw 403 when volunteer has not attended', async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValue({ id: 'evt-1' } as never);
      vi.mocked(prisma.attendance.findUnique).mockResolvedValue({ attended: false } as never);
      await expect(submitFeedback('evt-1', 'user-1', { rating: 5 })).rejects.toThrow(
        'not attended'
      );
    });

    it('should throw 409 when feedback already exists', async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValue({ id: 'evt-1' } as never);
      vi.mocked(prisma.attendance.findUnique).mockResolvedValue({ attended: true } as never);
      vi.mocked(prisma.eventFeedback.findUnique).mockResolvedValue({ id: 'existing-fb' } as never);
      await expect(submitFeedback('evt-1', 'user-1', { rating: 5 })).rejects.toThrow(
        'already submitted'
      );
    });

    it('should throw 400 when rating is below 1', async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValue({ id: 'evt-1' } as never);
      vi.mocked(prisma.attendance.findUnique).mockResolvedValue({ attended: true } as never);
      vi.mocked(prisma.eventFeedback.findUnique).mockResolvedValue(null);
      await expect(submitFeedback('evt-1', 'user-1', { rating: 0 })).rejects.toThrow(
        'Rating must be between 1 and 5'
      );
    });

    it('should throw 400 when rating is above 5', async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValue({ id: 'evt-1' } as never);
      vi.mocked(prisma.attendance.findUnique).mockResolvedValue({ attended: true } as never);
      vi.mocked(prisma.eventFeedback.findUnique).mockResolvedValue(null);
      await expect(submitFeedback('evt-1', 'user-1', { rating: 6 })).rejects.toThrow(
        'Rating must be between 1 and 5'
      );
    });

    it('should throw 400 when confidenceLevel is out of range', async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValue({ id: 'evt-1' } as never);
      vi.mocked(prisma.attendance.findUnique).mockResolvedValue({ attended: true } as never);
      vi.mocked(prisma.eventFeedback.findUnique).mockResolvedValue(null);
      await expect(
        submitFeedback('evt-1', 'user-1', { rating: 3, confidenceLevel: 0 })
      ).rejects.toThrow('Confidence level must be between 1 and 5');
    });

    it('should submit feedback successfully', async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValue({ id: 'evt-1' } as never);
      vi.mocked(prisma.attendance.findUnique).mockResolvedValue({ attended: true } as never);
      vi.mocked(prisma.eventFeedback.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.eventFeedback.create).mockResolvedValue({
        id: 'fb-1',
        rating: 4,
        comments: 'Great!',
      } as never);
      const result = await submitFeedback('evt-1', 'user-1', {
        rating: 4,
        comments: 'Great!',
      });
      expect(result.rating).toBe(4);
    });
  });

  describe('getEventFeedbackSummary', () => {
    it('should return summary with average and distribution', async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValue({
        id: 'evt-1',
        opportunity: { createdById: 'user-1', organizationId: null },
      } as never);
      vi.mocked(prisma.eventFeedback.aggregate).mockResolvedValue({
        _avg: { rating: 4.666666666666667 },
        _count: 3,
      } as never);
      vi.mocked(prisma.eventFeedback.groupBy).mockResolvedValue([
        { rating: 5, _count: 2 },
        { rating: 4, _count: 1 },
      ] as never);

      const result = await getEventFeedbackSummary('evt-1', 'user-1', 'ADMIN', null);
      expect(result.average).toBe(4.7);
      expect(result.count).toBe(3);
      expect(result.distribution[5]).toBe(2);
    });

    it('should return empty summary when no feedback', async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValue({
        id: 'evt-1',
        opportunity: { createdById: 'user-1', organizationId: null },
      } as never);
      vi.mocked(prisma.eventFeedback.aggregate).mockResolvedValue({
        _avg: { rating: null },
        _count: 0,
      } as never);
      vi.mocked(prisma.eventFeedback.groupBy).mockResolvedValue([]);
      const result = await getEventFeedbackSummary('evt-1', 'user-1', 'ADMIN', null);
      expect(result.average).toBe(0);
      expect(result.count).toBe(0);
    });

    it('should throw 404 when event not found', async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValue(null);
      await expect(getEventFeedbackSummary('bad-id', 'user-1', 'ADMIN', null)).rejects.toThrow(
        'Event not found'
      );
    });

    it('should throw 403 when not authorized', async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValue({
        id: 'evt-1',
        opportunity: { createdById: 'other-user', organizationId: null },
      } as never);
      await expect(getEventFeedbackSummary('evt-1', 'user-1', 'VOLUNTEER', null)).rejects.toThrow(
        'Forbidden'
      );
    });
  });

  describe('getMyFeedback', () => {
    it('should return paginated feedback', async () => {
      vi.mocked(prisma.eventFeedback.findMany).mockResolvedValue([
        {
          id: 'fb-1',
          rating: 5,
          comments: null,
          learnings: null,
          confidenceLevel: null,
          volunteerId: 'user-1',
          createdAt: new Date(),
          eventId: 'evt-1',
          event: { title: 'Test Event', eventDate: new Date() },
        },
      ] as never);
      vi.mocked(prisma.eventFeedback.count).mockResolvedValue(1);
      const result = await getMyFeedback('user-1', { page: 1, limit: 20 });
      expect(result.data).toHaveLength(1);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('getEventFeedback', () => {
    it('should throw 404 when event not found', async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValue(null);
      await expect(getEventFeedback('bad-id', 'user-1', 'ADMIN', null)).rejects.toThrow(
        'Event not found'
      );
    });

    it('should throw 403 when not authorized', async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValue({
        id: 'evt-1',
        opportunity: { createdById: 'other-user', organizationId: 'other-org' },
      } as never);
      await expect(getEventFeedback('evt-1', 'user-1', 'VOLUNTEER', 'org-1')).rejects.toThrow(
        'Forbidden'
      );
    });

    it('should return feedback without pagination', async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValue({
        id: 'evt-1',
        opportunity: { createdById: 'user-1', organizationId: null },
      } as never);
      vi.mocked(prisma.eventFeedback.findMany).mockResolvedValue([
        { id: 'fb-1', rating: 5 },
      ] as never);
      const result = await getEventFeedback('evt-1', 'user-1', 'COORDINATOR', null);
      expect(result).toHaveLength(1);
    });

    it('should return paginated feedback', async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValue({
        id: 'evt-1',
        opportunity: { createdById: 'user-1', organizationId: null },
      } as never);
      vi.mocked(prisma.eventFeedback.findMany).mockResolvedValue([
        { id: 'fb-1', rating: 5 },
      ] as never);
      vi.mocked(prisma.eventFeedback.count).mockResolvedValue(1);
      const result = await getEventFeedback('evt-1', 'user-1', 'ADMIN', null, {
        page: 1,
        limit: 20,
      });
      expect(result.totalPages).toBe(1);
    });
  });

  describe('updateFeedback', () => {
    it('should throw 404 when feedback not found', async () => {
      vi.mocked(prisma.eventFeedback.findUnique).mockResolvedValue(null);
      await expect(updateFeedback('evt-1', 'user-1', { rating: 4 })).rejects.toThrow(
        'Feedback not found'
      );
    });

    it('should update feedback successfully', async () => {
      vi.mocked(prisma.eventFeedback.findUnique).mockResolvedValue({ id: 'fb-1' } as never);
      vi.mocked(prisma.eventFeedback.update).mockResolvedValue({ id: 'fb-1', rating: 4 } as never);
      const result = await updateFeedback('evt-1', 'user-1', { rating: 4 });
      expect(result.rating).toBe(4);
    });
  });

  describe('deleteFeedback', () => {
    it('should throw 404 when feedback not found', async () => {
      vi.mocked(prisma.eventFeedback.findUnique).mockResolvedValue(null);
      await expect(deleteFeedback('evt-1', 'user-1')).rejects.toThrow('Feedback not found');
    });

    it('should delete feedback successfully', async () => {
      vi.mocked(prisma.eventFeedback.findUnique).mockResolvedValue({ id: 'fb-1' } as never);
      vi.mocked(prisma.eventFeedback.delete).mockResolvedValue({ id: 'fb-1' } as never);
      const result = await deleteFeedback('evt-1', 'user-1');
      expect(result.id).toBe('fb-1');
    });
  });
});
