import { describe, expect, it } from 'vitest';
import { istDateKey, istDayNumber } from '../date.utils';

describe('IST date utils', () => {
  // 2026-08-22T00:00 IST == 2026-08-21T18:30Z
  const start = new Date('2026-08-21T18:30:00.000Z');

  it('formats the IST calendar date key', () => {
    expect(istDateKey(start)).toBe('2026-08-22');
    expect(istDateKey(new Date('2026-08-22T18:59:00.000Z'))).toBe('2026-08-23'); // 00:29 IST next day
  });

  it('returns Day 1 on the start date itself (early morning UTC)', () => {
    expect(istDayNumber(start, new Date('2026-08-22T04:00:00.000Z'))).toBe(1); // 09:30 IST
  });

  it('advances at IST midnight, not UTC midnight', () => {
    expect(istDayNumber(start, new Date('2026-08-22T18:20:00.000Z'))).toBe(1); // 23:50 IST day1
    expect(istDayNumber(start, new Date('2026-08-22T18:35:00.000Z'))).toBe(2); // 00:05 IST day2
  });

  it('reaches Day 7 exactly six calendar days later', () => {
    expect(istDayNumber(start, new Date('2026-08-27T18:30:00.000Z'))).toBe(7);
    expect(istDayNumber(start, new Date('2026-08-28T18:35:00.000Z'))).toBe(8); // 00:05 IST Day 8 — fixed: 10:00Z is still Day 7 (15:30 IST)
  });
});
