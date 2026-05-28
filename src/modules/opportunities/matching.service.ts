import { prisma } from '../../lib/prisma';

export async function getRecommendedOpportunities(volunteerId: string) {
  // 1. Fetch volunteer's profile
  const profile = await prisma.volunteerProfile.findUnique({
    where: { userId: volunteerId },
  });

  // 2. Fetch all ACTIVE opportunities with startDate in the future
  const opportunities = await prisma.opportunity.findMany({
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

  // 4. Fallback: no profile or empty skills+interests → 10 most recent with matchScore: 0
  const hasProfile = profile && (profile.skills.length > 0 || profile.interests.length > 0);

  if (!hasProfile) {
    return available
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10)
      .map((o) => ({ ...o, matchScore: 0 }));
  }

  // 5. Score each opportunity
  const scored = available.map((o) => {
    // Skill overlap: matching skills / opportunity skills count (0 if no skills on opportunity)
    const skillOverlap =
      o.skills.length === 0
        ? 0
        : o.skills.filter((s) => profile.skills.includes(s)).length / o.skills.length;

    // Interest match: 1 if volunteer's interests includes opportunity category (case-insensitive)
    const interestMatch = profile.interests.some(
      (i) => i.toLowerCase() === o.category.toLowerCase()
    )
      ? 1
      : 0;

    // Availability match: 1 if volunteer has any availability days set
    const availDays: string[] = (profile.availability as { days?: string[] })?.days ?? [];
    const availabilityMatch = availDays.length > 0 ? 1 : 0;

    const score = Math.round(skillOverlap * 50 + interestMatch * 30 + availabilityMatch * 20);

    return { ...o, matchScore: score };
  });

  // 6. Sort by score DESC, return top 10
  return scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, 10);
}
