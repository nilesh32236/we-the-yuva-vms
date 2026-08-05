// Lightweight in-memory sliding-window rate limiter, keyed by string.
// Used to throttle OTP generation server-side (the client countdown is only a
// UX affordance). Not durable across restarts, which is acceptable for
// mitigating OTP send spam within a single process instance.

const windows: Record<string, number[]> = {};

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = windows[key] ?? [];
  windows[key] = timestamps.filter((t) => now - t < windowMs);

  if (windows[key].length >= limit) {
    return true;
  }

  windows[key].push(now);
  return false;
}

// Test-only helper to clear state between tests.
export function _resetRateLimits(): void {
  for (const k of Object.keys(windows)) {
    delete windows[k];
  }
}