import { describe, expect, it } from 'vitest';
import { LinkStorySchema, StartChallengeSchema } from '@/shared';

describe('StartChallengeSchema', () => {
  it('accepts acts with custom Other text merged in', () => {
    const r = StartChallengeSchema.safeParse({
      acts: ['Help someone without being asked', 'Teach my neighbour basic computer skills'],
      startDate: '2026-09-01',
    });
    expect(r.success).toBe(true);
  });

  it('rejects empty acts', () => {
    expect(StartChallengeSchema.safeParse({ acts: [], startDate: '2026-09-01' }).success).toBe(false);
  });
});

describe('LinkStorySchema', () => {
  it('requires storyId', () => {
    expect(LinkStorySchema.safeParse({}).success).toBe(false);
  });
});
