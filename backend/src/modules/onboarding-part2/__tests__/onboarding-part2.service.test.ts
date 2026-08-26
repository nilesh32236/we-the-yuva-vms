import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    kindnessChallenge: { findUnique: vi.fn() },
    volunteerOnboardingPart2: { findUnique: vi.fn(), upsert: vi.fn() },
  },
}));

const { prisma } = await import('@/lib/prisma');
import { getPart2, upsertPart2 } from '../onboarding-part2.service';
import { AppError } from '@/middleware/error.middleware';

const fiftyWords = Array(50).fill('word').join(' ');

function validInput() {
  return {
    kindnessReflection: fiftyWords,
    aspirations: 'Aspire',
    roleMappings: [
      'CAPACITY_BUILDER_TRAINER',
      'COMMUNITY_OUTREACH_SURVEY',
      'GRIEVANCE_SUPPORT_FACILITATOR',
      'SOLUTION_CAMP_COORDINATOR',
      'STAKEHOLDER_LIAISON',
      'WARD_AREA_AMBASSADOR',
      'PROGRAMME_DATA_SUPPORTER',
      'VOLUNTEER_ENGAGEMENT_SUPPORTER',
    ].map((role) => ({ role, skillsOffer: '', skillsDevelop: '' })),
    lifeSkills: ['COMMUNICATION', 'LEADERSHIP'],
    languages: [],
    volunteerRoleTier: 'GENERAL_VOLUNTEER' as const,
    hasVolunteered: false,
    emergencyContactName: 'John',
    emergencyRelationship: 'Father',
    emergencyMobile: '+919876543210',
    privacyPolicyConsent: true as const,
    codeOfConductConsent: true as const,
    mediaConsent: true,
    whatsappConsent: false,
  } as never;
}

describe('getPart2', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects when role not VOLUNTEER (ADMIN)', async () => {
    await expect(getPart2('u1', 'ADMIN')).rejects.toMatchObject({ status: 403 });
  });
  it('rejects when role COORDINATOR', async () => {
    await expect(getPart2('u1', 'COORDINATOR')).rejects.toMatchObject({ status: 403 });
  });
  it('rejects when role ORGANIZATION_ADMIN', async () => {
    await expect(getPart2('u1', 'ORGANIZATION_ADMIN')).rejects.toMatchObject({ status: 403 });
  });
  it('returns unlocked false when challenge is null', async () => {
    vi.mocked(prisma.kindnessChallenge.findUnique).mockResolvedValue(null);
    const r = await getPart2('u1', 'VOLUNTEER');
    expect(r.unlocked).toBe(false);
    expect(r.data).toBe(null);
  });
  it('returns unlocked false when part2UnlockedAt null', async () => {
    vi.mocked(prisma.kindnessChallenge.findUnique).mockResolvedValue({ part2UnlockedAt: null } as never);
    const r = await getPart2('u1', 'VOLUNTEER');
    expect(r.unlocked).toBe(false);
  });
  it('returns unlocked true + data when unlocked and row exists', async () => {
    vi.mocked(prisma.kindnessChallenge.findUnique).mockResolvedValue({ part2UnlockedAt: new Date() } as never);
    vi.mocked(prisma.volunteerOnboardingPart2.findUnique).mockResolvedValue({ id: 'p1' } as never);
    const r = await getPart2('u1', 'VOLUNTEER');
    expect(r.unlocked).toBe(true);
    expect(r.data).toEqual({ id: 'p1' });
  });
  it('returns unlocked true + null when unlocked but no row yet', async () => {
    vi.mocked(prisma.kindnessChallenge.findUnique).mockResolvedValue({ part2UnlockedAt: new Date() } as never);
    vi.mocked(prisma.volunteerOnboardingPart2.findUnique).mockResolvedValue(null);
    const r = await getPart2('u1', 'VOLUNTEER');
    expect(r.unlocked).toBe(true);
    expect(r.data).toBe(null);
  });
});

describe('upsertPart2', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects when role not VOLUNTEER (COORDINATOR)', async () => {
    await expect(upsertPart2('u1', 'COORDINATOR', validInput())).rejects.toBeInstanceOf(AppError);
  });
  it('rejects when role ADMIN', async () => {
    await expect(upsertPart2('u1', 'ADMIN', validInput())).rejects.toMatchObject({ status: 403 });
  });
  it('rejects when locked (part2UnlockedAt null)', async () => {
    vi.mocked(prisma.kindnessChallenge.findUnique).mockResolvedValue({ part2UnlockedAt: null } as never);
    await expect(upsertPart2('u1', 'VOLUNTEER', validInput())).rejects.toMatchObject({ status: 403 });
  });
  it('rejects when challenge null (locked)', async () => {
    vi.mocked(prisma.kindnessChallenge.findUnique).mockResolvedValue(null);
    await expect(upsertPart2('u1', 'VOLUNTEER', validInput())).rejects.toMatchObject({ status: 403 });
  });
  it('upserts and sets completedAt', async () => {
    vi.mocked(prisma.kindnessChallenge.findUnique).mockResolvedValue({ part2UnlockedAt: new Date() } as never);
    vi.mocked(prisma.volunteerOnboardingPart2.upsert).mockResolvedValue({ id: 'p1', completedAt: new Date() } as never);
    const r = await upsertPart2('u1', 'VOLUNTEER', validInput());
    expect(r.id).toBe('p1');
    const args = vi.mocked(prisma.volunteerOnboardingPart2.upsert).mock.calls[0][0] as { create: { completedAt: Date }; update: { completedAt: Date } };
    expect(args.create.completedAt).toBeInstanceOf(Date);
    expect(args.update.completedAt).toBeInstanceOf(Date);
  });
  it('upserts with correct where userId', async () => {
    vi.mocked(prisma.kindnessChallenge.findUnique).mockResolvedValue({ part2UnlockedAt: new Date() } as never);
    vi.mocked(prisma.volunteerOnboardingPart2.upsert).mockResolvedValue({ id: 'p1' } as never);
    await upsertPart2('user123', 'VOLUNTEER', validInput());
    const args = vi.mocked(prisma.volunteerOnboardingPart2.upsert).mock.calls[0][0] as { where: { userId: string } };
    expect(args.where.userId).toBe('user123');
  });
  it('creates with input data spread', async () => {
    vi.mocked(prisma.kindnessChallenge.findUnique).mockResolvedValue({ part2UnlockedAt: new Date() } as never);
    vi.mocked(prisma.volunteerOnboardingPart2.upsert).mockResolvedValue({ id: 'p1' } as never);
    const input = validInput();
    await upsertPart2('u1', 'VOLUNTEER', input);
    const args = vi.mocked(prisma.volunteerOnboardingPart2.upsert).mock.calls[0][0] as { create: Record<string, unknown> };
    expect(args.create.kindnessReflection).toBe(input.kindnessReflection);
    expect(args.create.lifeSkills).toEqual(input.lifeSkills);
  });
});
