import { prisma } from '../../lib/prisma';

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

class LRUCache {
  private max: number;
  private cache: Map<string, CacheEntry>;

  constructor(max: number) {
    this.max = max;
    this.cache = new Map();
  }

  get(key: string): CacheEntry | undefined {
    const entry = this.cache.get(key);
    if (entry) {
      this.cache.delete(key);
      this.cache.set(key, entry);
    }
    return entry;
  }

  set(key: string, entry: CacheEntry): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.max) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, entry);
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

const cache = new LRUCache(100);
const CACHE_TTL = 120_000; // 2 minutes

function getCacheKey(params: Record<string, unknown>): string {
  return `leaderboard:${JSON.stringify(params)}`;
}

export function invalidateCache(params?: Record<string, unknown>): void {
  if (params) {
    cache.delete(getCacheKey(params));
  } else {
    cache.clear();
  }
}

export async function getLeaderboard(params: {
  scope?: 'global' | 'location';
  timeframe?: 'weekly' | 'monthly' | 'alltime';
  sortBy?: 'points' | 'hours';
  locationId?: string;
}) {
  const cacheKey = getCacheKey(params);
  const cached = cache.get(cacheKey);
  if (cached?.expiresAt > Date.now()) {
    return cached.data;
  }

  const { scope = 'global', timeframe = 'alltime', sortBy = 'points', locationId } = params;

  let dateFilter: Date | undefined;
  const now = new Date();
  if (timeframe === 'weekly') {
    dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (timeframe === 'monthly') {
    dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const where: Record<string, unknown> = { status: 'ACTIVE', roleRef: { name: 'VOLUNTEER' } };
  if (scope === 'location' && locationId) {
    where.locationId = locationId;
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      points: true,
      currentLevel: { select: { name: true, badgeIcon: true, color: true } },
      location: { select: { name: true, district: true } },
      profile: { select: { avatarUrl: true, totalHours: true } },
      _count: {
        select: {
          attendances: dateFilter
            ? { where: { attended: true, checkedInAt: { gte: dateFilter } } }
            : { where: { attended: true } },
        },
      },
    },
    // TODO: Add composite index on (points, profile.totalHours) for performance — current JOIN is slow at scale
    orderBy: sortBy === 'points' ? { points: 'desc' } : { profile: { totalHours: 'desc' } },
    take: 50,
  });

  const ranked = users.map((u, i) => ({
    rank: i + 1,
    id: u.id,
    name: u.name,
    email: u.email,
    points: u.points,
    hours: u.profile?.totalHours ?? 0,
    level: u.currentLevel,
    location: u.location,
    avatarUrl: u.profile?.avatarUrl,
    eventsAttended: u._count.attendances,
  }));

  cache.set(cacheKey, { data: ranked, expiresAt: Date.now() + CACHE_TTL });

  return ranked;
}
