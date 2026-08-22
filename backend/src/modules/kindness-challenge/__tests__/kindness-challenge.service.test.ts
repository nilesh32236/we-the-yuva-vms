import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    kindnessChallenge: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    story: { findFirst: vi.fn() },
  },
}));
vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

const { prisma } = await import('@/lib/prisma');
import {
  checkIn,
  getMyChallenge,
  linkExistingStory,
  startChallenge,
} from '../kindness-challenge.service';
import { AppError } from '@/middleware/error.middleware';

const START = new Date('2026-08-21T18:30:00.000Z'); // Day 1 = 2026-08-22 IST
const DAY3 = new Date('2026-08-24T10:00:00.000Z'); // 15:30 IST, Day 3
const DAY7 = new Date('2026-08-27T18:30:00.000Z'); // Day 7 start
const activeChallenge = {
  id: 'ch1',
  userId: 'u1',
  acts: ['Help someone'],
  startDate: START,
  endDate: new Date('2026-08-28T18:30:00.000Z'),
  status: 'ACTIVE',
  storyId: null,
  checkIns: [{ day: 1 }, { day: 2 }],
};

describe('startChallenge', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a challenge with endDate = startDate+7d', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ profileComplete: true } as never);
    vi.mocked(prisma.kindnessChallenge.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.kindnessChallenge.create).mockResolvedValue(activeChallenge as never);
    const r = await startChallenge('u1', { acts: ['Help someone'], startDate: START }, START);
    expect(r.status).toBe('ACTIVE');
    const arg = vi.mocked(prisma.kindnessChallenge.create).mock.calls[0][0] as { data: { endDate: Date } };
    expect(arg.data.endDate.getTime()).toBe(START.getTime() + 7 * 86_400_000);
  });

  it('rejects when onboarding is incomplete (403)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ profileComplete: false } as never);
    await expect(startChallenge('u1', { acts: ['x'], startDate: START }, DAY3)).rejects.toMatchObject({ status: 403 });
  });

  it('rejects when a challenge already exists (409)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ profileComplete: true } as never);
    vi.mocked(prisma.kindnessChallenge.findUnique).mockResolvedValue(activeChallenge as never);
    await expect(startChallenge('u1', { acts: ['x'], startDate: START }, DAY3)).rejects.toBeInstanceOf(AppError);
  });

  it('rejects past startDate and >90 days ahead', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ profileComplete: true } as never);
    vi.mocked(prisma.kindnessChallenge.findUnique).mockResolvedValue(null);
    await expect(
      startChallenge('u1', { acts: ['x'], startDate: new Date('2026-08-01T00:00:00Z') }, DAY3)
    ).rejects.toBeInstanceOf(AppError);
    await expect(
      startChallenge('u1', { acts: ['x'], startDate: new Date('2027-01-01T00:00:00Z') }, DAY3)
    ).rejects.toBeInstanceOf(AppError);
  });
});

describe('getMyChallenge view', () => {
  beforeEach(() => vi.clearAllMocks());

  it('computes canCheckInToday=false when today already checked in', async () => {
    vi.mocked(prisma.kindnessChallenge.findUnique).mockResolvedValue(activeChallenge as never);
    const { view } = (await getMyChallenge('u1', DAY3))!;
    expect(view.currentDay).toBe(3);
    expect(view.canCheckInToday).toBe(true);
    expect(view.canShareStory).toBe(false);
  });

  it('canShareStory from the START of day 7 (calendar-inclusive)', async () => {
    vi.mocked(prisma.kindnessChallenge.findUnique).mockResolvedValue({ ...activeChallenge } as never);
    const { view } = (await getMyChallenge('u1', DAY7))!;
    expect(view.canShareStory).toBe(true);
  });
});

describe('checkIn', () => {
  beforeEach(() => vi.clearAllMocks());

  it('records check-in with derived day number', async () => {
    vi.mocked(prisma.kindnessChallenge.findUnique).mockResolvedValue({ ...activeChallenge } as never);
    await checkIn('u1', DAY3);
    expect(prisma.kindnessChallenge.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { checkIns: { create: [{ day: 3 }] } } })
    );
  });

  it('rejects double check-in same day (409)', async () => {
    vi.mocked(prisma.kindnessChallenge.findUnique).mockResolvedValue({
      ...activeChallenge,
      checkIns: [{ day: 3 }],
    } as never);
    await expect(checkIn('u1', DAY3)).rejects.toMatchObject({ status: 409 });
  });
});

describe('linkExistingStory', () => {
  beforeEach(() => vi.clearAllMocks());

  it('completes challenge when story owned + unlinked', async () => {
    vi.mocked(prisma.kindnessChallenge.findUnique).mockResolvedValue({ ...activeChallenge } as never);
    vi.mocked(prisma.story.findFirst).mockResolvedValue({ id: 's1', userId: 'u1' } as never);
    vi.mocked(prisma.kindnessChallenge.update).mockResolvedValue(activeChallenge as never);
    await linkExistingStory('u1', 's1', DAY7);
    expect(prisma.kindnessChallenge.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          storyId: 's1',
          status: 'COMPLETED',
          part2UnlockedAt: expect.any(Date),
        }),
      })
    );
  });
});
