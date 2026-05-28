import crypto from 'node:crypto';
import type { EventInput } from '@/shared';
import { prisma } from '../../lib/prisma';
import { notificationsQueue } from '../../lib/queue';
import { AppError } from '../../middleware/error.middleware';

// ─── Event CRUD ───────────────────────────────────────────────────

export async function createEvent(
  opportunityId: string,
  coordinatorId: string,
  callerRole: string,
  data: EventInput
) {
  const opportunity = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
  });

  if (!opportunity) {
    throw new AppError('Opportunity not found', 404);
  }

  if (callerRole !== 'ADMIN' && opportunity.createdById !== coordinatorId) {
    throw new AppError('Forbidden', 403);
  }

  const eventDate = new Date(data.eventDate);

  const event = await prisma.event.create({
    data: {
      ...data,
      eventDate,
      opportunityId,
      qrToken: crypto.randomBytes(32).toString('hex'),
      qrExpiresAt: new Date(eventDate.getTime() + 24 * 60 * 60 * 1000),
    },
  });

  // Enqueue event-invitation jobs for all ACCEPTED volunteers
  const acceptedApplications = await prisma.application.findMany({
    where: { opportunityId, status: 'ACCEPTED' },
    select: { volunteerId: true },
  });

  for (const { volunteerId } of acceptedApplications) {
    await notificationsQueue.add('event-invitation', {
      volunteerId,
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.eventDate,
      venue: event.venue ?? event.meetingLink,
    });
  }

  return event;
}

export async function listEventsByOpportunity(opportunityId: string) {
  return prisma.event.findMany({
    where: {
      opportunityId,
      status: { not: 'CANCELLED' },
    },
    orderBy: { eventDate: 'asc' },
  });
}

export async function listAllEvents(pagination: { page: number; limit: number }) {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.event.findMany({
      where: { status: { not: 'CANCELLED' } },
      skip,
      take: limit,
      orderBy: { eventDate: 'asc' },
      include: {
        opportunity: { select: { title: true } },
      },
    }),
    prisma.event.count({ where: { status: { not: 'CANCELLED' } } }),
  ]);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getEventById(id: string) {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      opportunity: {
        select: {
          title: true,
          createdBy: { select: { name: true } },
        },
      },
    },
  });

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  return event;
}

export async function updateEvent(
  id: string,
  callerId: string,
  callerRole: string,
  data: EventInput
) {
  const event = await prisma.event.findUnique({
    where: { id },
    include: { opportunity: true },
  });

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  if (callerRole !== 'ADMIN' && event.opportunity.createdById !== callerId) {
    throw new AppError('Forbidden', 403);
  }

  return prisma.event.update({
    where: { id },
    data: {
      ...data,
      eventDate: new Date(data.eventDate),
    },
  });
}

export async function cancelEvent(id: string, callerId: string, callerRole: string) {
  const event = await prisma.event.findUnique({
    where: { id },
    include: { opportunity: true },
  });

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  if (callerRole !== 'ADMIN' && event.opportunity.createdById !== callerId) {
    throw new AppError('Forbidden', 403);
  }

  return prisma.event.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });
}

// ─── Attendance ───────────────────────────────────────────────────

export async function markAttendance(
  eventId: string,
  attendances: { volunteerId: string; attended: boolean }[]
) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  // Calculate event duration in hours from "HH:MM" strings
  const [startH, startM] = event.startTime.split(':').map(Number);
  const [endH, endM] = event.endTime.split(':').map(Number);
  const durationHours = (endH * 60 + endM - (startH * 60 + startM)) / 60;

  const volunteerIds = attendances.map((a) => a.volunteerId);

  // Batch-fetch all ACCEPTED applications for these volunteers on this event's opportunity
  const applications = await prisma.application.findMany({
    where: {
      volunteerId: { in: volunteerIds },
      opportunityId: event.opportunityId,
      status: 'ACCEPTED',
    },
    select: { id: true, volunteerId: true },
  });
  const appByVolunteer = new Map(applications.map((a) => [a.volunteerId, a.id]));

  // Batch-fetch existing attendance records for these volunteers
  const existingRecords = await prisma.attendance.findMany({
    where: { eventId, volunteerId: { in: volunteerIds } },
  });
  const existingByVolunteer = new Map(existingRecords.map((r) => [r.volunteerId, r]));

  // Build upsert operations
  const upsertOps = [];
  const hourAdjustments: { userId: string; increment: number }[] = [];

  for (const { volunteerId, attended } of attendances) {
    const applicationId = appByVolunteer.get(volunteerId);
    if (!applicationId) continue;

    const existing = existingByVolunteer.get(volunteerId);

    upsertOps.push(
      prisma.attendance.upsert({
        where: { eventId_volunteerId: { eventId, volunteerId } },
        create: { eventId, volunteerId, applicationId, attended },
        update: { attended, updatedAt: new Date() },
      })
    );

    // Determine hour adjustment
    if (!existing && attended) {
      hourAdjustments.push({ userId: volunteerId, increment: durationHours });
    } else if (existing?.attended && !attended) {
      hourAdjustments.push({ userId: volunteerId, increment: -durationHours });
    } else if (existing && !existing.attended && attended) {
      hourAdjustments.push({ userId: volunteerId, increment: durationHours });
    }
  }

  // Execute all upserts and hour adjustments in a transaction
  await prisma.$transaction([
    ...upsertOps,
    ...hourAdjustments.map((adj) =>
      prisma.volunteerProfile.update({
        where: { userId: adj.userId },
        data: { totalHours: { increment: adj.increment } },
      })
    ),
  ]);

  return prisma.attendance.count({ where: { eventId, attended: true } });
}

export async function getAttendanceList(eventId: string) {
  return prisma.attendance.findMany({
    where: { eventId },
    include: {
      volunteer: { select: { name: true, email: true } },
    },
    orderBy: { volunteer: { name: 'asc' } },
  });
}

export async function getMyEvents(volunteerId: string) {
  return prisma.event.findMany({
    where: {
      opportunity: {
        applications: {
          some: { volunteerId, status: 'ACCEPTED' },
        },
      },
      status: { not: 'CANCELLED' },
    },
    include: {
      opportunity: { select: { title: true } },
      attendances: { where: { volunteerId } },
    },
    orderBy: { eventDate: 'asc' },
  });
}

// ─── QR Code ──────────────────────────────────────────────────────

function generateQrToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function getOrCreateEventQrToken(eventId: string): Promise<{
  token: string;
  expiresAt: Date | null;
  eventDate: Date;
  eventTitle: string;
}> {
  const event = await prisma.event.findUnique({ where: { id: eventId } });

  if (!event) throw new AppError('Event not found', 404);

  if (event.qrToken) {
    return {
      token: event.qrToken,
      expiresAt: event.qrExpiresAt,
      eventDate: event.eventDate,
      eventTitle: event.title,
    };
  }

  const qrExpiresAt = new Date(event.eventDate.getTime() + 24 * 60 * 60 * 1000);
  const token = generateQrToken();

  // Atomic: only succeeds if qrToken is still null (race-condition-safe)
  const { count } = await prisma.event.updateMany({
    where: { id: eventId, qrToken: null },
    data: { qrToken: token, qrExpiresAt },
  });

  if (count === 0) {
    const updated = await prisma.event.findUnique({ where: { id: eventId } })!;
    return {
      token: updated!.qrToken!,
      expiresAt: updated!.qrExpiresAt,
      eventDate: event.eventDate,
      eventTitle: event.title,
    };
  }

  return {
    token,
    expiresAt: qrExpiresAt,
    eventDate: event.eventDate,
    eventTitle: event.title,
  };
}

// ─── Self Check-in / Check-out ────────────────────────────────────

export async function checkIn(
  eventId: string,
  volunteerId: string,
  location?: { lat: number; lng: number },
  qrToken?: string
) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new AppError('Event not found', 404);
  if (event.status === 'CANCELLED') throw new AppError('Event is cancelled', 400);

  if (qrToken) {
    if (event.qrToken !== qrToken) throw new AppError('Invalid QR code', 400);
    if (event.qrExpiresAt && new Date() > event.qrExpiresAt) {
      throw new AppError('QR code has expired', 400);
    }
  }

  const application = await prisma.application.findFirst({
    where: { volunteerId, opportunityId: event.opportunityId, status: 'ACCEPTED' },
  });
  if (!application) throw new AppError('No accepted application for this event', 403);

  const existing = await prisma.attendance.findUnique({
    where: { eventId_volunteerId: { eventId, volunteerId } },
  });
  if (existing?.checkedInAt) throw new AppError('Already checked in', 400);

  return prisma.attendance.upsert({
    where: { eventId_volunteerId: { eventId, volunteerId } },
    create: {
      eventId,
      volunteerId,
      applicationId: application.id,
      attended: true,
      checkedInAt: new Date(),
      checkInLat: location?.lat,
      checkInLng: location?.lng,
    },
    update: {
      attended: true,
      checkedInAt: new Date(),
      checkInLat: location?.lat,
      checkInLng: location?.lng,
    },
  });
}

export async function checkOut(
  eventId: string,
  volunteerId: string,
  location?: { lat: number; lng: number }
) {
  const attendance = await prisma.attendance.findUnique({
    where: { eventId_volunteerId: { eventId, volunteerId } },
    include: { event: true },
  });
  if (!attendance) throw new AppError('Not checked in', 400);
  if (!attendance.checkedInAt) throw new AppError('Must check in first', 400);
  if (attendance.checkedOutAt) throw new AppError('Already checked out', 400);

  const now = new Date();
  const hoursWorked = (now.getTime() - attendance.checkedInAt.getTime()) / 3_600_000;

  const [updated] = await prisma.$transaction([
    prisma.attendance.update({
      where: { eventId_volunteerId: { eventId, volunteerId } },
      data: {
        checkedOutAt: now,
        checkOutLat: location?.lat,
        checkOutLng: location?.lng,
      },
    }),
    prisma.volunteerProfile.update({
      where: { userId: volunteerId },
      data: { totalHours: { increment: hoursWorked } },
    }),
  ]);

  return updated;
}

function sanitizeCsvCell(value: string): string {
  if (/^[=+\-@]/.test(value)) {
    return `'${value}`;
  }
  return value;
}

export async function exportEventsCsv() {
  const events = await prisma.event.findMany({
    orderBy: { eventDate: 'desc' },
    include: {
      opportunity: { select: { title: true } },
      _count: { select: { attendances: true } },
    },
  });

  const header = 'Title,Opportunity,Date,Start,End,Status,Capacity,Attendances,Virtual\n';
  const rows = events
    .map((e) =>
      [
        `"${sanitizeCsvCell(e.title)}"`,
        `"${sanitizeCsvCell(e.opportunity.title)}"`,
        e.eventDate.toISOString().split('T')[0],
        e.startTime,
        e.endTime,
        e.status,
        e.capacity,
        e._count.attendances,
        e.isVirtual ? 'Yes' : 'No',
      ].join(',')
    )
    .join('\n');

  return header + rows;
}
