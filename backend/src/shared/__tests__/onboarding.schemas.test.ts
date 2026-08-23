import { describe, expect, it } from 'vitest';
import { OnboardingSchema } from '@/shared';

const validBase = {
  gender: 'MALE',
  whatsappNumber: '+919876543210',
  address: { city: 'Mumbai', district: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
  education: 'B.Tech',
  currentStatus: 'STUDENT',
  volunteerType: 'STUDENT_VOLUNTEER',
  timeCommitment: { hoursPerWeek: 5 },
  opportunityInterests: ['EDUCATION'],
  whyVoluntary: 'I want to give back.',
  skills: ['Teaching'],
  digitalReadiness: {
    smartphone: true,
    whatsapp: true,
    laptop: false,
    onlineVolunteering: true,
    tools: ['Zoom/Meet'],
  },
  referralSource: 'FRIEND',
  referralSourceName: 'Priya',
  declarations: { infoCorrect: true, commitmentsAccepted: true },
};

describe('OnboardingSchema', () => {
  it('accepts a valid student payload', () => {
    const r = OnboardingSchema.safeParse({
      ...validBase,
      student: { institution: 'X College', course: 'BSc', yearSemester: 'Sem 3', city: 'Mumbai' },
    });
    expect(r.success).toBe(true);
  });

  it('rejects STUDENT without student details', () => {
    const r = OnboardingSchema.safeParse(validBase);
    expect(r.success).toBe(false);
  });

  it('requires referralSourceName when source is FRIEND', () => {
    const r = OnboardingSchema.safeParse({ ...validBase, referralSourceName: undefined });
    expect(r.success).toBe(false);
  });

  it('rejects false declaration', () => {
    const r = OnboardingSchema.safeParse({
      ...validBase,
      declarations: { infoCorrect: true, commitmentsAccepted: false },
    });
    expect(r.success).toBe(false);
  });

  it('rejects invalid pincode', () => {
    const r = OnboardingSchema.safeParse({
      ...validBase,
      address: { ...validBase.address, pincode: '1234' },
    });
    expect(r.success).toBe(false);
  });
});
