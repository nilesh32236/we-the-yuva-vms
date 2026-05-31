import { describe, expect, it } from 'vitest';

import {
  StaffProfileSchema,
  UpdateMeSchema,
  VolunteerProfileSchema,
} from '../schemas/profile.schemas';

describe('profile.schemas', () => {
  describe('VolunteerProfileSchema', () => {
    it('should accept valid volunteer profile', () => {
      const result = VolunteerProfileSchema.safeParse({
        volunteerType: 'STUDENT',
        skills: ['Teaching'],
        interests: ['Education'],
        availability: { days: ['Mon', 'Tue'], timeSlots: ['Morning', 'Afternoon'] },
        bio: 'I love teaching',
      });
      expect(result.success).toBe(true);
    });

    it('should accept profile without bio', () => {
      const result = VolunteerProfileSchema.safeParse({
        volunteerType: 'PROFESSIONAL',
        skills: ['Mentoring'],
        interests: ['Community'],
        availability: { days: ['Sat'], timeSlots: ['Weekend'] },
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty skills', () => {
      const result = VolunteerProfileSchema.safeParse({
        volunteerType: 'STUDENT',
        skills: [],
        interests: ['Education'],
        availability: { days: ['Mon'], timeSlots: ['Morning'] },
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty interests', () => {
      const result = VolunteerProfileSchema.safeParse({
        volunteerType: 'STUDENT',
        skills: ['Teaching'],
        interests: [],
        availability: { days: ['Mon'], timeSlots: ['Morning'] },
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty days', () => {
      const result = VolunteerProfileSchema.safeParse({
        volunteerType: 'STUDENT',
        skills: ['Teaching'],
        interests: ['Education'],
        availability: { days: [], timeSlots: ['Morning'] },
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty time slots', () => {
      const result = VolunteerProfileSchema.safeParse({
        volunteerType: 'STUDENT',
        skills: ['Teaching'],
        interests: ['Education'],
        availability: { days: ['Mon'], timeSlots: [] },
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid volunteerType', () => {
      const result = VolunteerProfileSchema.safeParse({
        volunteerType: 'INVALID',
        skills: ['Teaching'],
        interests: ['Education'],
        availability: { days: ['Mon'], timeSlots: ['Morning'] },
      });
      expect(result.success).toBe(false);
    });

    it('should reject bio over 500 chars', () => {
      const result = VolunteerProfileSchema.safeParse({
        volunteerType: 'STUDENT',
        skills: ['Teaching'],
        interests: ['Education'],
        availability: { days: ['Mon'], timeSlots: ['Morning'] },
        bio: 'x'.repeat(501),
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid day', () => {
      const result = VolunteerProfileSchema.safeParse({
        volunteerType: 'STUDENT',
        skills: ['Teaching'],
        interests: ['Education'],
        availability: { days: ['InvalidDay'], timeSlots: ['Morning'] },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('StaffProfileSchema', () => {
    it('should accept valid staff profile', () => {
      const result = StaffProfileSchema.safeParse({
        locationName: 'Mumbai',
        district: 'Mumbai',
        state: 'Maharashtra',
        department: 'Education',
        designation: 'Teacher',
      });
      expect(result.success).toBe(true);
    });

    it('should accept staff profile with only required fields', () => {
      const result = StaffProfileSchema.safeParse({
        locationName: 'Mumbai',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing locationName', () => {
      const result = StaffProfileSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateMeSchema', () => {
    it('should accept valid update', () => {
      const result = UpdateMeSchema.safeParse({ name: 'New Name' });
      expect(result.success).toBe(true);
    });

    it('should accept all optional fields', () => {
      const result = UpdateMeSchema.safeParse({
        name: 'New Name',
        email: 'new@example.com',
        volunteerType: 'REMOTE',
      });
      expect(result.success).toBe(true);
    });

    it('should reject short name', () => {
      const result = UpdateMeSchema.safeParse({ name: 'A' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const result = UpdateMeSchema.safeParse({ email: 'bad' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid volunteerType', () => {
      const result = UpdateMeSchema.safeParse({ volunteerType: 'INVALID' });
      expect(result.success).toBe(false);
    });
  });
});
