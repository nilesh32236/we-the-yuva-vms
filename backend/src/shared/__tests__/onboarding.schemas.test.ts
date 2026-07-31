import { describe, expect, it } from 'vitest';

import { OnboardingSchema } from '../schemas/onboarding.schemas';

describe('onboarding.schemas', () => {
  const fullPayload = {
    step1: {
      skills: ['teaching'],
      expertise: ['TEACHING'],
      languages: ['ENGLISH'],
    },
    step2: {
      causes: ['EDUCATION'],
      interests: ['TEACHING_MENTORING'],
      preferredActivities: ['TEACHING'],
    },
    step3: {
      volunteerType: 'STUDENT',
      availabilityPattern: 'WEEKENDS',
      hoursPerWeek: 5,
      sessionDuration: 2,
    },
    step4: {
      education: "Bachelor's degree",
      occupation: 'Student',
      experience: '1 year',
      certifications: [],
    },
    step5: {
      bio: 'Passionate about education',
      avatarUrl: 'https://example.com/avatar.png',
      socialLinks: { linkedin: 'https://linkedin.com/in/user' },
    },
  };

  it('should accept a full onboarding payload', () => {
    const result = OnboardingSchema.safeParse(fullPayload);
    expect(result.success).toBe(true);
  });

  it('should accept a partial onboarding payload with a single step', () => {
    const result = OnboardingSchema.safeParse({
      step1: fullPayload.step1,
    });
    expect(result.success).toBe(true);
  });

  it('should reject an empty body', () => {
    const result = OnboardingSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject when no step is present', () => {
    const result = OnboardingSchema.safeParse({ step1: undefined });
    expect(result.success).toBe(false);
  });

  it('should reject a partial step with missing required fields', () => {
    const result = OnboardingSchema.safeParse({
      step1: { expertise: ['TEACHING'] },
    });
    expect(result.success).toBe(false);
  });
});
