import { describe, expect, it } from 'vitest';
import { Part2Schema } from '@/shared/schemas/part2.schemas';

const fiftyWords = Array(50).fill('word').join(' ');
const twoHundredWords = Array(200).fill('word').join(' ');
const fortyNineWords = Array(49).fill('word').join(' ');
const twoHundredOneWords = Array(201).fill('word').join(' ');

function validBase(overrides: Record<string, unknown> = {}) {
  return {
    kindnessReflection: fiftyWords,
    aspirations: 'I want to serve community',
    roleMappings: [
      'CAPACITY_BUILDER_TRAINER',
      'COMMUNITY_OUTREACH_SURVEY',
      'GRIEVANCE_SUPPORT_FACILITATOR',
      'SOLUTION_CAMP_COORDINATOR',
      'STAKEHOLDER_LIAISON',
      'WARD_AREA_AMBASSADOR',
      'PROGRAMME_DATA_SUPPORTER',
      'VOLUNTEER_ENGAGEMENT_SUPPORTER',
    ].map((role) => ({ role, skillsOffer: 'offer', skillsDevelop: 'develop' })),
    lifeSkills: ['COMMUNICATION', 'LEADERSHIP'] as const,
    languages: [],
    volunteerRoleTier: 'GENERAL_VOLUNTEER' as const,
    hasVolunteered: false,
    emergencyContactName: 'John Doe',
    emergencyRelationship: 'Father',
    emergencyMobile: '+919876543210',
    privacyPolicyConsent: true as const,
    codeOfConductConsent: true as const,
    mediaConsent: true,
    whatsappConsent: false,
    ...overrides,
  };
}

describe('Part2Schema', () => {
  it('accepts valid payload with 50 words (lower bound)', () => {
    const r = Part2Schema.safeParse(validBase({ kindnessReflection: fiftyWords }));
    expect(r.success).toBe(true);
  });

  it('accepts 200 words (upper bound)', () => {
    const r = Part2Schema.safeParse(validBase({ kindnessReflection: twoHundredWords }));
    expect(r.success).toBe(true);
  });

  it('rejects 49 words', () => {
    const r = Part2Schema.safeParse(validBase({ kindnessReflection: fortyNineWords }));
    expect(r.success).toBe(false);
  });

  it('rejects 201 words', () => {
    const r = Part2Schema.safeParse(validBase({ kindnessReflection: twoHundredOneWords }));
    expect(r.success).toBe(false);
  });

  it('rejects lifeSkills with <2', () => {
    const r = Part2Schema.safeParse(validBase({ lifeSkills: ['COMMUNICATION'] }));
    expect(r.success).toBe(false);
  });

  it('requires lifeSkillsOther when OTHER selected', () => {
    const r = Part2Schema.safeParse(validBase({ lifeSkills: ['COMMUNICATION', 'OTHER'], lifeSkillsOther: '' }));
    expect(r.success).toBe(false);
    const r2 = Part2Schema.safeParse(validBase({ lifeSkills: ['COMMUNICATION', 'OTHER'], lifeSkillsOther: 'My skill' }));
    expect(r2.success).toBe(true);
  });

  it('requires previousOrgName/previousRole when hasVolunteered true', () => {
    const r = Part2Schema.safeParse(validBase({ hasVolunteered: true, previousOrgName: '', previousRole: '' }));
    expect(r.success).toBe(false);
    const r2 = Part2Schema.safeParse(validBase({ hasVolunteered: true, previousOrgName: 'Org', previousRole: 'Volunteer' }));
    expect(r2.success).toBe(true);
  });

  it('rejects invalid urls', () => {
    const r = Part2Schema.safeParse(validBase({ linkedinUrl: 'not-a-url' }));
    expect(r.success).toBe(false);
  });

  it('accepts empty url literals', () => {
    const r = Part2Schema.safeParse(validBase({ linkedinUrl: '' }));
    expect(r.success).toBe(true);
  });

  it('rejects invalid emergencyMobile', () => {
    const r = Part2Schema.safeParse(validBase({ emergencyMobile: '123' }));
    expect(r.success).toBe(false);
  });

  it('rejects missing privacy consent', () => {
    const r = Part2Schema.safeParse(validBase({ privacyPolicyConsent: false } as never));
    expect(r.success).toBe(false);
  });

  it('rejects roleMappings not length 8', () => {
    const r = Part2Schema.safeParse(validBase({ roleMappings: [{ role: 'CAPACITY_BUILDER_TRAINER' }] }));
    expect(r.success).toBe(false);
  });
});
