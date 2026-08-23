const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 86_400_000;

export function istDateKey(d: Date): string {
  const shifted = new Date(d.getTime() + IST_OFFSET_MS);
  return shifted.toISOString().slice(0, 10);
}

function istEpochDay(d: Date): number {
  return Date.parse(`${istDateKey(d)}T00:00:00Z`) / DAY_MS;
}

/** Day 1 = startDate's IST calendar date. */
export function istDayNumber(startDate: Date, now: Date = new Date()): number {
  return istEpochDay(now) - istEpochDay(startDate) + 1;
}
