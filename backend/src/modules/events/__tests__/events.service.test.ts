import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    opportunity: { findUnique: vi.fn() },
    event: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
    application: { findMany: vi.fn(), findFirst: vi.fn() },
    attendance: {
      upsert: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    volunteerProfile: { update: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/audit', () => ({ logAudit: vi.fn() }));
vi.mock('@/lib/queue', () => ({
  notificationsQueue: { add: vi.fn().mockReturnValue(Promise.resolve({ id: 'job-1' })) },
}));
vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn() } }));

vi.mock('node:crypto', () => ({
  default: { randomBytes: vi.fn(() => Buffer.alloc(32, 0x42)) },
  randomBytes: vi.fn(() => Buffer.alloc(32, 0x42)),
}));

const { prisma } = await import('@/lib/prisma');

import {
  cancelEvent,
  checkIn,
  checkOut,
  createEvent,
  exportEventsCsv,
  getAttendanceList,
  getEventById,
  getMyEvents,
  getOrCreateEventQrToken,
  listAllEvents,
  listEventsByOpportunity,
  markAttendance,
  updateEvent,
} from '../events.service';

const baseEvent = {
  id: 'event-1',
  title: 'Test Event',
  description: '',
  eventDate: new Date(), // within check-in window
  startTime: '09:00',
  endTime: '17:00',
  venue: 'Hall A',
  capacity: 50,
  isVirtual: false,
  meetingLink: null,
  status: 'ACTIVE' as const,
  opportunityId: 'opp-1',
  qrToken: null,
  qrExpiresAt: null,
  createdById: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const baseOpp = {
  id: 'opp-1',
  title: 'Test Opp',
  description: '',
  skills: [],
  category: 'EDUCATION' as const,
  status: 'ACTIVE' as const,
  startDate: new Date(),
  endDate: new Date(),
  hoursPerSession: 2,
  totalSlots: 10,
  isRemote: false,
  organizationId: 'org-1',
  createdById: 'user-1',
  locationId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('events.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createEvent', () => {
    it('should throw 404 when opportunity not found', async () => {
      vi.mocked(prisma.opportunity.findUnique).mockResolvedValue(null);
      await expect(
        createEvent('bad-opp', 'user-1', 'COORDINATOR', 'org-1', {} as never)
      ).rejects.toThrow('Opportunity not found');
    });

    it('should throw 403 when not authorized', async () => {
      vi.mocked(prisma.opportunity.findUnique).mockResolvedValue({
        ...baseOpp,
        createdById: 'other-user',
        organizationId: 'other-org',
      });
      await expect(
        createEvent('opp-1', 'user-1', 'VOLUNTEER', 'org-1', {} as never)
      ).rejects.toThrow('Forbidden');
    });

    it('should create event when owner', async () => {
      vi.mocked(prisma.opportunity.findUnique).mockResolvedValue(baseOpp);
      vi.mocked(prisma.event.create).mockResolvedValue(baseEvent);
      vi.mocked(prisma.application.findMany).mockResolvedValue([]);
      const result = await createEvent('opp-1', 'user-1', 'COORDINATOR', 'org-1', {
        title: 'Test Event',
        description: '',
        eventDate: '2026-07-01',
        startTime: '09:00',
        endTime: '17:00',
        venue: 'Hall A',
        capacity: 50,
        isVirtual: false,
      });
      expect(result.id).toBe('event-1');
    });

    it('should create event when sys admin', async () => {
      vi.mocked(prisma.opportunity.findUnique).mockResolvedValue(baseOpp);
      vi.mocked(prisma.event.create).mockResolvedValue(baseEvent);
      vi.mocked(prisma.application.findMany).mockResolvedValue([]);
      const result = await createEvent('opp-1', 'admin-1', 'ADMIN', null, {
        title: 'Test Event',
        description: '',
        eventDate: '2026-07-01',
        startTime: '09:00',
        endTime: '17:00',
        venue: 'Hall A',
        capacity: 50,
        isVirtual: false,
      });
      expect(result.id).toBe('event-1');
    });
  });

  describe('getEventById', () => {
    it('should throw 404 when not found', async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValue(null);
      await expect(getEventById('bad-id')).rejects.toThrow('Event not found');
    });

    it('should return event with opportunity', async () => {
      const eventWithOpp = {
        ...baseEvent,
        opportunity: { title: 'Test Opp', createdBy: { name: 'User' } },
      };
      vi.mocked(prisma.event.findUnique).mockResolvedValue(eventWithOpp as never);
      const result = await getEventById('event-1');
      expect(result.opportunity.title).toBe('Test Opp');
    });
  });

  describe('updateEvent', () => {
    it('should throw 404 when not found', async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValue(null);
      await expect(
        updateEvent('bad-id', 'user-1', 'COORDINATOR', 'org-1', {} as never)
      ).rejects.toThrow('Event not found');
    });

    it('should throw 403 when not authorized', async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValue({
        ...baseEvent,
        opportunity: { ...baseOpp, createdById: 'other-user', organizationId: 'other-org' },
      });
      await expect(
        updateEvent('event-1', 'user-1', 'VOLUNTEER', 'org-1', {} as never)
      ).rejects.toThrow('Forbidden');
    });

    it('should update event successfully', async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValue({
        ...baseEvent,
        opportunity: baseOpp,
      });
      vi.mocked(prisma.event.update).mockResolvedValue({ ...baseEvent, title: 'Updated' });
      const result = await updateEvent('event-1', 'user-1', 'COORDINATOR', 'org-1', {
        title: 'Updated',
        description: '',
        eventDate: '2026-07-01',
        startTime: '09:00',
        endTime: '17:00',
        venue: 'Hall A',
        capacity: 50,
        isVirtual: false,
      });
      expect(result.title).toBe('Updated');
    });
  });

  describe('cancelEvent', () => {
    it('should throw 404 when event not found', async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValue(null);
      await expect(cancelEvent('bad-id', 'user-1', 'COORDINATOR', 'org-1')).rejects.toThrow(
        'Event not found'
      );
    });

    it('should throw 403 when not authorized', async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValue({
        ...baseEvent,
        opportunity: { ...baseOpp, createdById: 'other-user', organizationId: 'other-org' },
      });
      await expect(cancelEvent('event-1', 'user-1', 'VOLUNTEER', 'org-1')).rejects.toThrow(
        'Forbidden'
      );
    });

    it('should cancel event successfully', async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValue({ ...baseEvent, opportunity: baseOpp });
      vi.mocked(prisma.event.update).mockResolvedValue({ ...baseEvent, status: 'CANCELLED' });
      const result = await cancelEvent('event-1', 'user-1', 'COORDINATOR', 'org-1');
      expect(result.status).toBe('CANCELLED');
    });
  });

  describe('markAttendance', () => {
    it('should throw 404 when event not found', async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValue(null);
      await expect(markAttendance('bad-id', 'user-1', 'COORDINATOR', 'org-1', [])).rejects.toThrow(
        'Event not found'
      );
    });

    it('should throw 400 when event has no start/end time', async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValue({
        ...baseEvent,
        opportunity: baseOpp,
        startTime: null,
        endTime: null,
      });
      await expect(markAttendance('event-1', 'user-1', 'COORDINATOR', 'org-1', [])).rejects.toThrow(
        'Event has no start/end time configured'
      );
    });

    it('should throw 403 when not authorized', async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValue({
        ...baseEvent,
        opportunity: { ...baseOpp, createdById: 'other-user', organizationId: 'other-org' },
      });
      await expect(markAttendance('event-1', 'user-1', 'VOLUNTEER', 'org-1', [])).rejects.toThrow(
        'Forbidden'
      );
    });

    it('should mark attendance and update hours', async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValue({
        ...baseEvent,
        opportunity: baseOpp,
      });
      vi.mocked(prisma.application.findMany).mockResolvedValue([
        { id: 'app-1', volunteerId: 'v-1' },
      ] as never);
      vi.mocked(prisma.attendance.findMany).mockResolvedValue([]);
      vi.mocked(prisma.attendance.upsert).mockResolvedValue({} as never);
      vi.mocked(prisma.volunteerProfile.update).mockResolvedValue({} as never);
      vi.mocked(prisma.$transaction).mockResolvedValue([]);
      vi.mocked(prisma.attendance.count).mockResolvedValue(1);
      const result = await markAttendance('event-1', 'user-1', 'COORDINATOR', 'org-1', [
        { volunteerId: 'v-1', attended: true },
      ]);
      expect(result).toBe(1);
    });

    it('should handle hour reduction for unmarking attendance', async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValue({
        ...baseEvent,
        opportunity: baseOpp,
      });
      vi.mocked(prisma.application.findMany).mockResolvedValue([
        { id: 'app-1', volunteerId: 'v-1' },
      ] as never);
      vi.mocked(prisma.attendance.findMany).mockResolvedValue([
        { volunteerId: 'v-1', attended: true, checkedInAt: null, checkedOutAt: null },
      ] as never);
      vi.mocked(prisma.attendance.upsert).mockResolvedValue({} as never);
      vi.mocked(prisma.volunteerProfile.update).mockResolvedValue({} as never);
      vi.mocked(prisma.$transaction).mockResolvedValue([]);
      vi.mocked(prisma.attendance.count).mockResolvedValue(0);
      const result = await markAttendance('event-1', 'user-1', 'COORDINATOR', 'org-1', [
        { volunteerId: 'v-1', attended: false },
      ]);
      expect(result).toBe(0);
    });
  });

  describe('getOrCreateEventQrToken', () => {
    it('should throw 404 when event not found', async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValue(null);
      await expect(getOrCreateEventQrToken('bad-id')).rejects.toThrow('Event not found');
    });

    it('should return existing token', async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValue({
        ...baseEvent,
        qrToken: 'existing-token',
        qrExpiresAt: new Date(),
      });
      const result = await getOrCreateEventQrToken('event-1');
      expect(result.token).toBe('existing-token');
    });

    it('should generate new token', async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValueOnce(baseEvent);
      vi.mocked(prisma.event.updateMany).mockResolvedValue({ count: 1 });
      const result = await getOrCreateEventQrToken('event-1');
      expect(result.token).toBeTruthy();
    });

    it('should handle race condition fallback when count is 0', async () => {
      vi.mocked(prisma.event.findUnique)
        .mockResolvedValueOnce(baseEvent)
        .mockResolvedValueOnce({
          ...baseEvent,
          qrToken: 'fallback-token',
          qrExpiresAt: new Date(),
        });
      vi.mocked(prisma.event.updateMany).mockResolvedValue({ count: 0 });
      const result = await getOrCreateEventQrToken('event-1');
      expect(result.token).toBe('fallback-token');
    });

    it('should throw 500 when race condition leaves no token', async () => {
      vi.mocked(prisma.event.findUnique)
        .mockResolvedValueOnce(baseEvent)
        .mockResolvedValueOnce({ ...baseEvent, qrToken: null, qrExpiresAt: null });
      vi.mocked(prisma.event.updateMany).mockResolvedValue({ count: 0 });
      await expect(getOrCreateEventQrToken('event-1')).rejects.toThrow(
        'Failed to generate QR token'
      );
    });
  });

  describe('checkIn', () => {
    it('should throw 404 when event not found', async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValue(null);
      await expect(checkIn('bad-id', 'user-1')).rejects.toThrow('Event not found');
    });

    it('should throw 400 when event cancelled', async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValue({ ...baseEvent, status: 'CANCELLED' });
      await expect(checkIn('event-1', 'user-1')).rejects.toThrow('Event is cancelled');
    });

    it('should throw 400 when event is too far in the future', async () => {
      const farFuture = new Date();
      farFuture.setDate(farFuture.getDate() + 30);
      vi.mocked(prisma.event.findUnique).mockResolvedValue({
        ...baseEvent,
        eventDate: farFuture,
      });
      await expect(checkIn('event-1', 'user-1')).rejects.toThrow('too far in the future');
    });

    it('should throw 400 when event check-in window has passed', async () => {
      const farPast = new Date();
      farPast.setDate(farPast.getDate() - 30);
      vi.mocked(prisma.event.findUnique).mockResolvedValue({
        ...baseEvent,
        eventDate: farPast,
      });
      await expect(checkIn('event-1', 'user-1')).rejects.toThrow('already passed');
    });

    it('should throw 400 when QR token is invalid', async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValue({
        ...baseEvent,
        qrToken: 'real-token',
        qrExpiresAt: new Date(Date.now() + 3600000),
      });
      await expect(checkIn('event-1', 'user-1', undefined, 'wrong-token')).rejects.toThrow(
        'Invalid QR code'
      );
    });

    it('should throw 400 when QR code is expired', async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValue({
        ...baseEvent,
        qrToken: 'real-token',
        qrExpiresAt: new Date(Date.now() - 3600000),
      });
      await expect(checkIn('event-1', 'user-1', undefined, 'real-token')).rejects.toThrow(
        'QR code has expired'
      );
    });

    it('should throw 403 when no accepted application', async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValue(baseEvent);
      vi.mocked(prisma.application.findFirst).mockResolvedValue(null);
      await expect(checkIn('event-1', 'user-1')).rejects.toThrow('No accepted application');
    });

    it('should throw 400 when already checked in', async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValue(baseEvent);
      vi.mocked(prisma.application.findFirst).mockResolvedValue({ id: 'app-1' } as never);
      vi.mocked(prisma.attendance.findUnique).mockResolvedValue({
        checkedInAt: new Date(),
      } as never);
      await expect(checkIn('event-1', 'user-1')).rejects.toThrow('Already checked in');
    });

    it('should check in successfully', async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValue(baseEvent);
      vi.mocked(prisma.application.findFirst).mockResolvedValue({ id: 'app-1' } as never);
      vi.mocked(prisma.attendance.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.attendance.upsert).mockResolvedValue({
        eventId: 'event-1',
        volunteerId: 'user-1',
        attended: true,
        checkedInAt: new Date(),
      } as never);
      const result = await checkIn('event-1', 'user-1', { lat: 12.34, lng: 56.78 });
      expect(result.attended).toBe(true);
      expect(prisma.attendance.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ checkInLat: 12.34, checkInLng: 56.78 }),
        })
      );
    });
  });

  describe('checkOut', () => {
    it('should throw 400 when not checked in', async () => {
      vi.mocked(prisma.attendance.findUnique).mockResolvedValue(null);
      await expect(checkOut('event-1', 'user-1')).rejects.toThrow('Not checked in');
    });

    it('should throw 400 if not checked in first', async () => {
      vi.mocked(prisma.attendance.findUnique).mockResolvedValue({ checkedInAt: null } as never);
      await expect(checkOut('event-1', 'user-1')).rejects.toThrow('Must check in first');
    });

    it('should throw 400 when already checked out', async () => {
      vi.mocked(prisma.attendance.findUnique).mockResolvedValue({
        checkedInAt: new Date(),
        checkedOutAt: new Date(),
      } as never);
      await expect(checkOut('event-1', 'user-1')).rejects.toThrow('Already checked out');
    });

    it('should check out successfully', async () => {
      const checkInTime = new Date(Date.now() - 7200000); // 2 hours ago
      vi.mocked(prisma.attendance.findUnique).mockResolvedValue({
        checkedInAt: checkInTime,
        checkedOutAt: null,
        event: baseEvent,
      } as never);
      vi.mocked(prisma.attendance.update).mockResolvedValue({
        checkedOutAt: new Date(),
      } as never);
      vi.mocked(prisma.volunteerProfile.update).mockResolvedValue({} as never);
      vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}]);
      const result = await checkOut('event-1', 'user-1', { lat: 12.34, lng: 56.78 });
      expect(result).toBeDefined();
    });
  });

  describe('listEventsByOpportunity', () => {
    it('should return events without pagination', async () => {
      vi.mocked(prisma.event.findMany).mockResolvedValue([baseEvent]);
      const result = await listEventsByOpportunity('opp-1');
      expect(result).toHaveLength(1);
      expect(prisma.event.count).not.toHaveBeenCalled();
    });

    it('should return paginated events', async () => {
      vi.mocked(prisma.event.findMany).mockResolvedValue([baseEvent]);
      vi.mocked(prisma.event.count).mockResolvedValue(1);
      const result = await listEventsByOpportunity('opp-1', { page: 1, limit: 20 });
      expect(result.totalPages).toBe(1);
      expect(result.page).toBe(1);
    });
  });

  describe('listAllEvents', () => {
    it('should return all events without org filter', async () => {
      vi.mocked(prisma.event.findMany).mockResolvedValue([baseEvent]);
      vi.mocked(prisma.event.count).mockResolvedValue(1);
      const result = await listAllEvents(null, { page: 1, limit: 20 });
      expect(result.data).toHaveLength(1);
    });

    it('should filter by org id', async () => {
      vi.mocked(prisma.event.findMany).mockResolvedValue([baseEvent]);
      vi.mocked(prisma.event.count).mockResolvedValue(1);
      await listAllEvents('org-1', { page: 1, limit: 20 });
      expect(prisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ opportunity: { organizationId: 'org-1' } }),
        })
      );
    });
  });

  describe('getAttendanceList', () => {
    it('should return paginated attendance', async () => {
      const attRecord = {
        id: 'att-1',
        eventId: 'event-1',
        volunteerId: 'v-1',
        attended: true,
        checkedInAt: null,
        checkedOutAt: null,
        checkInLat: null,
        checkInLng: null,
        checkOutLat: null,
        checkOutLng: null,
        markedAt: new Date(),
        updatedAt: new Date(),
        applicationId: 'app-1',
        volunteer: { name: 'V', email: 'v@t.com' },
      };
      vi.mocked(prisma.attendance.findMany).mockResolvedValue([attRecord as never]);
      vi.mocked(prisma.attendance.count).mockResolvedValue(1);
      const result = await getAttendanceList('event-1', { page: 1, limit: 20 });
      expect(result.data).toHaveLength(1);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('getMyEvents', () => {
    it('should return paginated my events', async () => {
      const myEvent = { ...baseEvent, opportunity: { title: 'Test Opp' }, attendances: [] };
      vi.mocked(prisma.event.findMany).mockResolvedValue([myEvent as never]);
      vi.mocked(prisma.event.count).mockResolvedValue(1);
      const result = await getMyEvents('user-1', { page: 1, limit: 20 });
      expect(result.data).toHaveLength(1);
    });
  });

  describe('exportEventsCsv', () => {
    it('should return CSV header and rows', async () => {
      const eventWithMeta = {
        ...baseEvent,
        opportunity: { title: 'Test Opp' },
        _count: { attendances: 5 },
      };
      vi.mocked(prisma.event.findMany).mockResolvedValue([eventWithMeta as never]);
      const result = await exportEventsCsv(null);
      expect(result).toContain('Title');
      expect(result).toContain('Test Event');
      expect(result).toContain('5');
    });
  });
});
