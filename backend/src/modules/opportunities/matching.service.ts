import { logger } from '../../lib/logger';
import { prisma } from '../../lib/prisma';

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function computeLocationScore(
  volunteerLocation: {
    lat: number | null;
    lng: number | null;
    district: string | null;
    state: string | null;
    name: string;
  } | null,
  oppLocation: {
    lat: number | null;
    lng: number | null;
    district: string | null;
    state: string | null;
    name: string;
  } | null
): number {
  if (!volunteerLocation || !oppLocation) return 0;

  // Precise geo match (both have lat/lng)
  if (
    volunteerLocation.lat != null &&
    volunteerLocation.lng != null &&
    oppLocation.lat != null &&
    oppLocation.lng != null
  ) {
    const distance = haversineDistance(
      volunteerLocation.lat,
      volunteerLocation.lng,
      oppLocation.lat,
      oppLocation.lng
    );
    if (distance <= 5) return 25;
    if (distance <= 10) return 20;
    if (distance <= 25) return 15;
    if (distance <= 50) return 10;
    if (distance <= 100) return 5;
    return 0;
  }

  // Fallback: same district or same city name
  if (
    volunteerLocation.district &&
    oppLocation.district &&
    volunteerLocation.district === oppLocation.district
  )
    return 15;
  if (volunteerLocation.name.toLowerCase() === oppLocation.name.toLowerCase()) return 15;
  if (volunteerLocation.state && oppLocation.state && volunteerLocation.state === oppLocation.state)
    return 5;

  return 0;
}

export async function getRecommendedOpportunities(volunteerId: string) {
  try {
    // 1. Fetch volunteer's profile and location
    const [profile, volunteerUser] = await Promise.all([
      prisma.volunteerProfile.findUnique({ where: { userId: volunteerId } }),
      prisma.user.findUnique({
        where: { id: volunteerId },
        include: { location: true },
      }),
    ]);

    const volunteerLocation = volunteerUser?.location ?? null;

    // 2. Fetch all ACTIVE opportunities with startDate in the future
    const opportunities = await prisma.opportunity.findMany({
      take: 50,
      where: {
        status: 'ACTIVE',
        startDate: { gt: new Date() },
      },
      include: {
        _count: { select: { applications: { where: { status: 'ACCEPTED' } } } },
        location: true,
      },
    });

    // 3. Filter out full opportunities
    const available = opportunities.filter((o) => o._count.applications < o.totalSlots);

    // 4. Fallback: no profile or empty skills+interests
    const hasProfile = profile && (profile.skills.length > 0 || profile.interests.length > 0);

    if (!hasProfile) {
      return available
        .sort((a, b) => {
          const locA = computeLocationScore(volunteerLocation, a.location);
          const locB = computeLocationScore(volunteerLocation, b.location);
          return locB - locA || b.createdAt.getTime() - a.createdAt.getTime();
        })
        .slice(0, 10)
        .map((o) => ({
          ...o,
          matchScore: Math.round(computeLocationScore(volunteerLocation, o.location)),
        }));
    }

    // 5. Score each opportunity with new weighting
    const scored = available.map((o) => {
      const skillOverlap =
        o.skills.length === 0
          ? 0
          : o.skills.filter((s) => profile.skills.includes(s)).length / o.skills.length;

      const interestMatch = profile.interests.some(
        (i) => i.toLowerCase() === o.category.toLowerCase()
      )
        ? 1
        : 0;

      const locationScore = computeLocationScore(volunteerLocation, o.location);

      const score = Math.round(skillOverlap * 40 + interestMatch * 20 + locationScore);

      return { ...o, matchScore: score };
    });

    // 6. Attach user application status
    const top10 = scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, 10);
    const userApps = await prisma.application.findMany({
      where: { opportunityId: { in: top10.map((o) => o.id) }, volunteerId },
      select: { opportunityId: true, status: true },
    });
    const appMap = new Map(userApps.map((a) => [a.opportunityId, a]));
    return top10.map((o) => ({
      ...o,
      userApplication: appMap.has(o.id) ? { status: appMap.get(o.id)!.status } : null,
    }));
  } catch (error) {
    logger.error('Matching failed', { error });
    return [];
  }
}
