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
  it('accepts valid payload', () => {
    expect(Part2Schema.safeParse(validBase()).success).toBe(true);
  });
  it('accepts 50 words lower bound', () => {
    expect(Part2Schema.safeParse(validBase({ kindnessReflection: fiftyWords })).success).toBe(true);
  });
  it('accepts 200 words upper bound', () => {
    expect(Part2Schema.safeParse(validBase({ kindnessReflection: twoHundredWords })).success).toBe(true);
  });
  it('rejects 49 words', () => {
    expect(Part2Schema.safeParse(validBase({ kindnessReflection: fortyNineWords })).success).toBe(false);
  });
  it('rejects 201 words', () => {
    expect(Part2Schema.safeParse(validBase({ kindnessReflection: twoHundredOneWords })).success).toBe(false);
  });
  it('rejects empty kindnessReflection', () => {
    expect(Part2Schema.safeParse(validBase({ kindnessReflection: '' })).success).toBe(false);
  });
  it('rejects aspirations empty', () => {
    expect(Part2Schema.safeParse(validBase({ aspirations: '' })).success).toBe(false);
  });
  it('rejects aspirations over 1000', () => {
    expect(Part2Schema.safeParse(validBase({ aspirations: 'a'.repeat(1001) })).success).toBe(false);
  });
  it('rejects roleMappings not length 8', () => {
    expect(Part2Schema.safeParse(validBase({ roleMappings: [{ role: 'CAPACITY_BUILDER_TRAINER' }] })).success).toBe(false);
  });
  it('rejects duplicate role in roleMappings', () => {
    const dup = Array(8).fill({ role: 'CAPACITY_BUILDER_TRAINER', skillsOffer: '', skillsDevelop: '' });
    expect(Part2Schema.safeParse(validBase({ roleMappings: dup })).success).toBe(false);
  });
  it('accepts unique roles', () => {
    expect(Part2Schema.safeParse(validBase()).success).toBe(true);
  });
  it('rejects lifeSkills <2', () => {
    expect(Part2Schema.safeParse(validBase({ lifeSkills: ['COMMUNICATION'] })).success).toBe(false);
  });
  it('accepts lifeSkills 2', () => {
    expect(Part2Schema.safeParse(validBase({ lifeSkills: ['COMMUNICATION', 'LEADERSHIP'] })).success).toBe(true);
  });
  it('requires lifeSkillsOther when OTHER', () => {
    expect(Part2Schema.safeParse(validBase({ lifeSkills: ['COMMUNICATION', 'OTHER'], lifeSkillsOther: '' })).success).toBe(false);
    expect(Part2Schema.safeParse(validBase({ lifeSkills: ['COMMUNICATION', 'OTHER'], lifeSkillsOther: 'My skill' })).success).toBe(true);
  });
  it('ignores lifeSkillsOther when no OTHER', () => {
    expect(Part2Schema.safeParse(validBase({ lifeSkills: ['COMMUNICATION', 'LEADERSHIP'], lifeSkillsOther: '' })).success).toBe(true);
  });
  it('rejects hasVolunteered true missing org', () => {
    const r = Part2Schema.safeParse(validBase({ hasVolunteered: true, previousOrgName: '', previousRole: 'Role' }));
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.flatten().fieldErrors.previousOrgName).toBeDefined();
  });
  it('rejects hasVolunteered true missing role', () => {
    const r = Part2Schema.safeParse(validBase({ hasVolunteered: true, previousOrgName: 'Org', previousRole: '' }));
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.flatten().fieldErrors.previousRole).toBeDefined();
  });
  it('rejects hasVolunteered true missing both', () => {
    const r = Part2Schema.safeParse(validBase({ hasVolunteered: true, previousOrgName: '', previousRole: '' }));
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.flatten().fieldErrors.previousOrgName).toBeDefined();
      expect(r.error.flatten().fieldErrors.previousRole).toBeDefined();
    }
  });
  it('accepts hasVolunteered true with both', () => {
    expect(Part2Schema.safeParse(validBase({ hasVolunteered: true, previousOrgName: 'Org', previousRole: 'Volunteer' })).success).toBe(true);
  });
  it('accepts hasVolunteered false even with org/role', () => {
    expect(Part2Schema.safeParse(validBase({ hasVolunteered: false, previousOrgName: 'Org', previousRole: 'Role' })).success).toBe(true);
  });
  it('accepts hasVolunteered false without org/role', () => {
    expect(Part2Schema.safeParse(validBase({ hasVolunteered: false, previousOrgName: '', previousRole: '' })).success).toBe(true);
  });
  it('rejects invalid linkedinUrl', () => {
    expect(Part2Schema.safeParse(validBase({ linkedinUrl: 'not-a-url' })).success).toBe(false);
  });
  it('rejects invalid instagramUrl', () => {
    expect(Part2Schema.safeParse(validBase({ instagramUrl: 'not-a-url' })).success).toBe(false);
  });
  it('rejects invalid twitterUrl', () => {
    expect(Part2Schema.safeParse(validBase({ twitterUrl: 'not-url' })).success).toBe(false);
  });
  it('accepts empty url literals', () => {
    expect(Part2Schema.safeParse(validBase({ linkedinUrl: '', instagramUrl: '', twitterUrl: '', portfolioUrl: '' })).success).toBe(true);
  });
  it('accepts valid urls', () => {
    expect(Part2Schema.safeParse(validBase({ linkedinUrl: 'https://linkedin.com/in/x', portfolioUrl: 'https://example.com' })).success).toBe(true);
  });
  it('rejects invalid emergencyMobile short', () => {
    expect(Part2Schema.safeParse(validBase({ emergencyMobile: '123' })).success).toBe(false);
  });
  it('rejects invalid emergencyMobile letters', () => {
    expect(Part2Schema.safeParse(validBase({ emergencyMobile: 'abc1234567' })).success).toBe(false);
  });
  it('accepts valid emergencyMobile with +', () => {
    expect(Part2Schema.safeParse(validBase({ emergencyMobile: '+919876543210' })).success).toBe(true);
  });
  it('accepts valid emergencyMobile without +', () => {
    expect(Part2Schema.safeParse(validBase({ emergencyMobile: '919876543210' })).success).toBe(true);
  });
  it('rejects missing privacy consent', () => {
    expect(Part2Schema.safeParse(validBase({ privacyPolicyConsent: false } as never)).success).toBe(false);
  });
  it('rejects missing codeOfConduct consent', () => {
    expect(Part2Schema.safeParse(validBase({ codeOfConductConsent: false } as never)).success).toBe(false);
  });
  it('accepts media/whatsapp boolean', () => {
    expect(Part2Schema.safeParse(validBase({ mediaConsent: false, whatsappConsent: true })).success).toBe(true);
  });
  it('rejects languages over max 10', () => {
    const langs = Array(11).fill({ language: 'English', proficiency: 'BASIC' });
    expect(Part2Schema.safeParse(validBase({ languages: langs })).success).toBe(false);
  });
  it('rejects language empty', () => {
    expect(Part2Schema.safeParse(validBase({ languages: [{ language: '', proficiency: 'BASIC' }] })).success).toBe(false);
  });
  it('rejects invalid proficiency', () => {
    expect(Part2Schema.safeParse(validBase({ languages: [{ language: 'Hindi', proficiency: 'INVALID' as never }] })).success).toBe(false);
  });
});
