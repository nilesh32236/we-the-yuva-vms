import { describe, expect, it } from 'vitest';

import {
  ApplicationStatusSchema,
  ApplySchema,
  AttendanceSchema,
  CheckInSchema,
  CheckOutSchema,
  EventSchema,
  OpportunitySchema,
} from '../schemas/opportunity.schemas';

describe('opportunity.schemas', () => {
  describe('OpportunitySchema', () => {
    const valid = {
      title: 'Teach Math to Kids',
      description: 'Help underprivileged children learn mathematics in a fun way',
      skills: ['Teaching'],
      category: 'EDUCATION',
      startDate: '2026-08-01T00:00:00Z',
      endDate: '2026-09-01T00:00:00Z',
      hoursPerSession: 2,
      totalSlots: 10,
      isRemote: false,
    } as const;

    it('should accept valid opportunity', () => {
      const result = OpportunitySchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should accept remote opportunity with locationId', () => {
      const result = OpportunitySchema.safeParse({ ...valid, isRemote: true, locationId: 'loc-1' });
      expect(result.success).toBe(true);
    });

    it('should reject short title', () => {
      const result = OpportunitySchema.safeParse({ ...valid, title: 'Hi' });
      expect(result.success).toBe(false);
    });

    it('should reject short description', () => {
      const result = OpportunitySchema.safeParse({ ...valid, description: 'Too short' });
      expect(result.success).toBe(false);
    });

    it('should reject empty skills', () => {
      const result = OpportunitySchema.safeParse({ ...valid, skills: [] });
      expect(result.success).toBe(false);
    });

    it('should reject invalid category', () => {
      const result = OpportunitySchema.safeParse({ ...valid, category: 'INVALID' });
      expect(result.success).toBe(false);
    });

    it('should reject negative hoursPerSession', () => {
      const result = OpportunitySchema.safeParse({ ...valid, hoursPerSession: -1 });
      expect(result.success).toBe(false);
    });

    it('should reject non-integer totalSlots', () => {
      const result = OpportunitySchema.safeParse({ ...valid, totalSlots: 2.5 });
      expect(result.success).toBe(false);
    });

    it('should reject end date before start date', () => {
      const result = OpportunitySchema.safeParse({
        ...valid,
        startDate: '2026-09-01T00:00:00Z',
        endDate: '2026-08-01T00:00:00Z',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('EventSchema', () => {
    const valid = {
      title: 'Community Cleanup Drive',
      description: 'Let us clean the neighborhood park',
      eventDate: '2026-07-15T00:00:00Z',
      startTime: '09:00',
      endTime: '12:00',
      venue: 'Central Park',
      capacity: 50,
      isVirtual: false,
    } as const;

    it('should accept valid in-person event', () => {
      const result = EventSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should accept valid virtual event', () => {
      const result = EventSchema.safeParse({
        ...valid,
        isVirtual: true,
        meetingLink: 'https://meet.example.com/test',
      });
      expect(result.success).toBe(true);
    });

    it('should reject virtual event without meetingLink', () => {
      const result = EventSchema.safeParse({ ...valid, isVirtual: true });
      expect(result.success).toBe(false);
    });

    it('should reject end time before start time', () => {
      const result = EventSchema.safeParse({
        ...valid,
        startTime: '14:00',
        endTime: '09:00',
      });
      expect(result.success).toBe(false);
    });

    it('should reject short title', () => {
      const result = EventSchema.safeParse({ ...valid, title: 'Hi' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid time format', () => {
      const result = EventSchema.safeParse({ ...valid, startTime: '9:00' });
      expect(result.success).toBe(false);
    });

    it('should reject non-positive capacity', () => {
      const result = EventSchema.safeParse({ ...valid, capacity: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject invalid meetingLink', () => {
      const result = EventSchema.safeParse({
        ...valid,
        isVirtual: true,
        meetingLink: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('ApplySchema', () => {
    it('should accept empty input', () => {
      const result = ApplySchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('ApplicationStatusSchema', () => {
    it('should accept ACCEPTED', () => {
      const result = ApplicationStatusSchema.safeParse({ status: 'ACCEPTED' });
      expect(result.success).toBe(true);
    });

    it('should accept REJECTED', () => {
      const result = ApplicationStatusSchema.safeParse({ status: 'REJECTED' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const result = ApplicationStatusSchema.safeParse({ status: 'INVALID' });
      expect(result.success).toBe(false);
    });
  });

  describe('AttendanceSchema', () => {
    it('should accept valid attendance records', () => {
      const result = AttendanceSchema.safeParse({
        attendances: [
          { volunteerId: 'u1', attended: true },
          { volunteerId: 'u2', attended: false },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty attendances', () => {
      const result = AttendanceSchema.safeParse({ attendances: [] });
      expect(result.success).toBe(false);
    });
  });

  describe('CheckInSchema', () => {
    it('should accept with qrToken', () => {
      const result = CheckInSchema.safeParse({ qrToken: 'token-123' });
      expect(result.success).toBe(true);
    });

    it('should accept with coordinates', () => {
      const result = CheckInSchema.safeParse({ lat: 19.076, lng: 72.8777 });
      expect(result.success).toBe(true);
    });

    it('should accept empty input', () => {
      const result = CheckInSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('CheckOutSchema', () => {
    it('should accept with coordinates', () => {
      const result = CheckOutSchema.safeParse({ lat: 19.076, lng: 72.8777 });
      expect(result.success).toBe(true);
    });

    it('should accept empty input', () => {
      const result = CheckOutSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });
});
