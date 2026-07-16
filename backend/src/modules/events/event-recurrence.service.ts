import type { RecurrenceFrequency } from '@prisma/client';

export interface SeriesConfig {
  frequency: RecurrenceFrequency;
  daysOfWeek: number[];
  interval: number;
  startTime: string;
  endTime: string;
  endDate: Date | null;
  maxOccurrences: number | null;
  currentCount: number;
  customRule: unknown;
  anchorDate?: Date;
}

export function calculateNextDates(
  config: SeriesConfig,
  startFrom: Date,
  batchSize: number = 30
): Date[] {
  const dates: Date[] = [];
  const maxTotal = config.maxOccurrences ?? Infinity;
  const effectiveEnd = config.endDate ?? new Date('9999-12-31');
  const remaining = Math.min(batchSize, maxTotal - config.currentCount);

  if (remaining <= 0) return dates;

  const start = new Date(startFrom);
  start.setHours(0, 0, 0, 0);

  switch (config.frequency) {
    case 'DAILY':
      generateDaily(dates, start, remaining, config.interval, effectiveEnd);
      break;
    case 'WEEKLY':
      generateWeekly(dates, start, remaining, config.daysOfWeek, config.interval, effectiveEnd);
      break;
    case 'MONTHLY':
      generateMonthly(
        dates,
        start,
        remaining,
        config.interval,
        effectiveEnd,
        config.anchorDate?.getDate()
      );
      break;
    case 'CUSTOM':
      generateCustom(dates, start, remaining, config.customRule, effectiveEnd);
      break;
  }

  return dates;
}

function generateDaily(
  dates: Date[],
  start: Date,
  remaining: number,
  interval: number,
  endDate: Date
): void {
  const current = new Date(start);
  for (let i = 0; i < remaining && current <= endDate; i++) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + interval);
  }
}

function generateWeekly(
  dates: Date[],
  start: Date,
  remaining: number,
  daysOfWeek: number[],
  interval: number,
  endDate: Date
): void {
  if (daysOfWeek.length === 0) return;

  const sortedDays = [...daysOfWeek].sort();
  const current = new Date(start);

  while (dates.length < remaining) {
    const weekStart = new Date(current);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    for (const day of sortedDays) {
      if (dates.length >= remaining) break;
      const candidate = new Date(weekStart);
      candidate.setDate(weekStart.getDate() + day);
      candidate.setHours(0, 0, 0, 0);

      if (candidate >= start && candidate <= endDate) {
        dates.push(new Date(candidate));
      }
    }

    current.setDate(current.getDate() + 7 * interval);
    if (current > endDate) break;
  }
}

function generateMonthly(
  dates: Date[],
  start: Date,
  remaining: number,
  interval: number,
  endDate: Date,
  anchorDay?: number
): void {
  const targetDay = anchorDay ?? start.getDate();
  const current = new Date(start);
  current.setDate(1);

  let added = 0;
  let attempts = 0;
  const maxAttempts = remaining * 2;
  while (added < remaining && attempts < maxAttempts) {
    const lastDay = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
    const day = Math.min(targetDay, lastDay);
    const candidate = new Date(current);
    candidate.setDate(day);
    candidate.setHours(0, 0, 0, 0);

    if (candidate >= start && candidate <= endDate) {
      dates.push(new Date(candidate));
      added++;
    }

    current.setMonth(current.getMonth() + interval);
    attempts++;
    if (current > endDate) break;
  }
}

function generateCustom(
  dates: Date[],
  start: Date,
  remaining: number,
  _customRule: unknown,
  endDate: Date
): void {
  if (!_customRule || typeof _customRule !== 'object') {
    generateDaily(dates, start, remaining, 1, endDate);
    return;
  }

  const rule = _customRule as Record<string, unknown>;
  const type = rule.type as string | undefined;

  switch (type) {
    case 'weekly-interval': {
      const interval = (rule.interval as number) ?? 1;
      const days = (rule.daysOfWeek as number[]) ?? [];
      generateWeekly(dates, start, remaining, days, interval, endDate);
      break;
    }
    case 'monthly-by-position': {
      const nth = (rule.nth as number) ?? 1;
      const dayOfWeek = (rule.dayOfWeek as number) ?? 1;
      const weekInterval = (rule.interval as number) ?? 1;
      generateMonthlyByPosition(dates, start, remaining, nth, dayOfWeek, weekInterval, endDate);
      break;
    }
    default:
      generateDaily(dates, start, remaining, 1, endDate);
  }
}

function generateMonthlyByPosition(
  dates: Date[],
  start: Date,
  remaining: number,
  nth: number,
  dayOfWeek: number,
  interval: number,
  endDate: Date
): void {
  const current = new Date(start);
  current.setDate(1);

  for (let i = 0; i < remaining; i++) {
    const month = current.getMonth();
    const year = current.getFullYear();
    const lastDay = new Date(year, month + 1, 0).getDate();
    let count = 0;

    for (let d = 1; d <= lastDay; d++) {
      const date = new Date(year, month, d);
      if (date.getDay() === dayOfWeek) {
        count++;
        if (count === nth) {
          if (date >= start && date <= endDate) {
            dates.push(new Date(date));
          }
          break;
        }
      }
    }

    current.setMonth(current.getMonth() + interval);
    if (current > endDate) break;
  }
}
