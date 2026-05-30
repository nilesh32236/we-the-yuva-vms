import { prisma } from '../../lib/prisma';

export async function getVolunteerStats(volunteerId: string) {
  const [profile, eventsAttended, applications] = await Promise.all([
    prisma.volunteerProfile.findUnique({
      where: { userId: volunteerId },
      select: { totalHours: true },
    }),
    prisma.attendance.count({ where: { volunteerId, attended: true } }),
    prisma.application.count({ where: { volunteerId } }),
  ]);

  return {
    totalHours: profile?.totalHours ?? 0,
    eventsAttended,
    applications,
  };
}

export async function getCoordinatorStats(coordinatorId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [applications, eventsThisMonth, opportunities] = await Promise.all([
    prisma.application.findMany({
      where: {
        opportunity: { createdById: coordinatorId },
        status: 'ACCEPTED',
      },
      select: { volunteerId: true },
      distinct: ['volunteerId'],
    }),
    prisma.event.count({
      where: {
        opportunity: { createdById: coordinatorId },
        eventDate: { gte: startOfMonth, lte: endOfMonth },
        status: { not: 'CANCELLED' },
      },
    }),
    prisma.opportunity.count({
      where: { createdById: coordinatorId, status: 'ACTIVE' },
    }),
  ]);

  return {
    activeVolunteers: applications.length,
    eventsThisMonth,
    opportunities,
  };
}

export async function getAdminStats() {
  const [totalUsers, activeVolunteers, totalHoursResult] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'VOLUNTEER', status: 'ACTIVE' } }),
    prisma.volunteerProfile.aggregate({ _sum: { totalHours: true } }),
  ]);

  return {
    totalUsers,
    activeVolunteers,
    totalHours: totalHoursResult._sum.totalHours ?? 0,
  };
}

export async function getVolunteerImpactData(volunteerId: string) {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const now = new Date();

  const [profile, applications, attendances, storiesCount, feedbackCount] =
    await Promise.all([
      prisma.volunteerProfile.findUnique({
        where: { userId: volunteerId },
        select: { totalHours: true },
      }),
      prisma.application.count({ where: { volunteerId } }),
      prisma.attendance.findMany({
        where: {
          volunteerId,
          attended: true,
          event: { eventDate: { gte: twelveMonthsAgo, lte: now } },
        },
        select: {
          checkedInAt: true,
          checkedOutAt: true,
          event: {
            select: {
              eventDate: true,
              opportunity: { select: { category: true, hoursPerSession: true } },
            },
          },
        },
        orderBy: { event: { eventDate: 'asc' } },
      }),
      prisma.story.count({ where: { userId: volunteerId } }),
      prisma.eventFeedback.count({ where: { volunteerId } }),
    ]);

  const monthLabels: string[] = [];
  const now2 = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now2.getFullYear(), now2.getMonth() - i, 1);
    monthLabels.push(d.toLocaleString('default', { month: 'short', year: '2-digit' }));
  }

  const monthlyHours: Record<string, number> = {};
  const categoryHours: Record<string, number> = {};
  const categoryEvents: Record<string, number> = {};

  for (const att of attendances) {
    const date = att.event.eventDate;
    const label = date.toLocaleString('default', { month: 'short', year: '2-digit' });
    const hours =
      att.checkedInAt && att.checkedOutAt
        ? (att.checkedOutAt.getTime() - att.checkedInAt.getTime()) / 3_600_000
        : (att.event.opportunity.hoursPerSession ?? 1);
    monthlyHours[label] = (monthlyHours[label] ?? 0) + hours;

    const cat = att.event.opportunity.category;
    categoryHours[cat] = (categoryHours[cat] ?? 0) + hours;
    categoryEvents[cat] = (categoryEvents[cat] ?? 0) + 1;
  }

  const monthlyData = monthLabels.map((month) => ({
    month,
    hours: Math.round((monthlyHours[month] ?? 0) * 100) / 100,
  }));
  const categoryData = Object.entries(categoryHours).map(([category, hours]) => ({
    category,
    hours: Math.round(hours * 100) / 100,
  }));
  const categoryEventData = Object.entries(categoryEvents).map(([category, count]) => ({
    category,
    count,
  }));

  const eventsAttended = attendances.length;

  return {
    totalHours: profile?.totalHours ?? 0,
    eventsAttended,
    applications,
    storiesCount,
    feedbackCount,
    monthlyHours: monthlyData,
    categoryHours: categoryData,
    categoryEvents: categoryEventData,
  };
}

export async function getObserverStats() {
  const [totalVolunteers, totalHoursResult, activeEvents] = await Promise.all([
    prisma.user.count({ where: { role: 'VOLUNTEER', status: 'ACTIVE' } }),
    prisma.volunteerProfile.aggregate({ _sum: { totalHours: true } }),
    prisma.event.count({
      where: { eventDate: { gte: new Date() }, status: 'SCHEDULED' },
    }),
  ]);

  return {
    totalVolunteers,
    hoursServed: totalHoursResult._sum.totalHours ?? 0,
    activeEvents,
  };
}
