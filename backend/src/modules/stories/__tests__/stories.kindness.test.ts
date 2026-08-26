import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    story: { create: vi.fn() },
    kindnessChallenge: { findUnique: vi.fn(), updateMany: vi.fn() },
  },
}));
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn() }));
vi.mock('@/modules/kindness-challenge/date.utils', () => ({ istDayNumber: vi.fn(() => 3) }));

const { prisma } = await import('@/lib/prisma');
const { createStory } = await import('../stories.service');

describe('createStory kindness daily', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates daily post with kindnessChallengeId and day 3', async () => {
    vi.mocked(prisma.kindnessChallenge.findUnique).mockResolvedValue({ id: 'c1', userId: 'u1', status: 'ACTIVE', startDate: new Date() } as never);
    vi.mocked(prisma.story.create).mockResolvedValue({ id: 's1' } as never);
    const s = await createStory('u1', { title: 'T', content: 'C'.repeat(20), kindnessChallengeId: 'c1' } as never);
    expect(s.id).toBe('s1');
    const args = vi.mocked(prisma.story.create).mock.calls[0][0] as { data: { kindnessDay: number; isCompletion: boolean } };
    expect(args.data.kindnessDay).toBe(3);
    expect(args.data.isCompletion).toBe(false);
  });

  it('isCompletion true completes challenge (day 3 now allowed)', async () => {
    vi.mocked(prisma.kindnessChallenge.findUnique).mockResolvedValue({ id: 'c1', userId: 'u1', status: 'ACTIVE', startDate: new Date() } as never);
    // Mock transaction path
    const mockTx = { story: { create: vi.fn().mockResolvedValue({ id: 's2' }) }, kindnessChallenge: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) } };
    (prisma as unknown as { $transaction: unknown }).$transaction = vi.fn((fn) => fn(mockTx as never)) as never;
    const s = await createStory('u1', { title: 'T', content: 'C'.repeat(20), kindnessChallengeId: 'c1', isCompletion: true } as never);
    expect(s.id).toBe('s2');
    expect(mockTx.kindnessChallenge.updateMany).toHaveBeenCalled();
  });

  it('rejects when day out of window (future)', async () => {
    const { istDayNumber } = await import('@/modules/kindness-challenge/date.utils');
    vi.mocked(istDayNumber as unknown as { mockReturnValue: (v: number) => void }).mockReturnValue(8);
    vi.mocked(prisma.kindnessChallenge.findUnique).mockResolvedValue({ id: 'c1', userId: 'u1', status: 'ACTIVE', startDate: new Date() } as never);
    await expect(createStory('u1', { title: 'T', content: 'C'.repeat(20), kindnessChallengeId: 'c1' } as never)).rejects.toMatchObject({ status: 422 });
    vi.mocked(istDayNumber as unknown as { mockReturnValue: (v: number) => void }).mockReturnValue(3);
  });
});
