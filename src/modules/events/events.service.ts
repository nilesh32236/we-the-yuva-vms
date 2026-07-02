import crypto from 'node:crypto';
import type { Prisma } from '@prisma/client';
import type { EventInput } from '@/shared';
import { hasSystemRole } from '../../shared/helpers';
import { onEventCheckIn, onEventCheckOut } from '../badges/badge-engine.service';
import { logAudit } from '../../lib/audit';
import { logger } from '../../lib/logger';
import { prisma } from '../../lib/prisma';
import { notificationsQueue } from '../../lib/queue';
import { AppError } from '../../middleware/error.middleware';
import { generateIcs } from '../../utils/ical';

// ─── Event CRUD ───────────────────────────────────────────────────

export async function createEvent(
  opportunityId: string,
  coordinatorId: string,
  callerRole: string,
  callerOrgId: string | null | undefined,
  data: EventInput
) {
  const opportunity = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
  });

  if (!opportunity) {
    throw new AppError('Opportunity not found', 404);
  }

  const isSysAdmin = hasSystemRole(callerRole);
  const isOwner = opportunity.createdById === coordinatorId;
  const isSameOrg =
    opportunity.organizationId && callerOrgId && opportunity.organizationId === callerOrgId;

  if (!isSysAdmin && !isOwner && !isSameOrg) {
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

  await logAudit({
    userId: coordinatorId,
    action: 'EVENT_CREATE',
    targetId: event.id,
    targetType: 'Event',
    metadata: { opportunityId },
  });

  // Enqueue event-invitation jobs for all ACCEPTED volunteers
  const acceptedApplications = await prisma.application.findMany({
    where: { opportunityId, status: 'ACCEPTED' },
    select: { volunteerId: true },
  });

  for (const { volunteerId } of acceptedApplications) {
    notificationsQueue
      ?.add('event-invitation', {
        volunteerId,
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.eventDate,
        venue: event.venue ?? event.meetingLink,
      })
      .catch((err) =>
        logger.warn('Failed to enqueue event invitation', { error: (err as Error).message })
      );
  }

  return event;
}

export async function listEventsByOpportunity(
  opportunityId: string,
  pagination?: { page: number; limit: number }
) {
  if (!pagination) {
    return prisma.event.findMany({
      where: {
        opportunityId,
        status: { not: 'CANCELLED' },
      },
      orderBy: { eventDate: 'asc' },
    });
  }
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.event.findMany({
      where: { opportunityId, status: { not: 'CANCELLED' } },
      skip,
      take: limit,
      orderBy: { eventDate: 'asc' },
    }),
    prisma.event.count({ where: { opportunityId, status: { not: 'CANCELLED' } } }),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function listAllEvents(
  callerOrgId: string | null | undefined,
  pagination: { page: number; limit: number }
) {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const where = {
    status: { not: 'CANCELLED' as const },
    ...(callerOrgId ? { opportunity: { organizationId: callerOrgId } } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.event.findMany({
      where,
      skip,
      take: limit,
      orderBy: { eventDate: 'asc' },
      include: {
        opportunity: { select: { title: true } },
      },
    }),
    prisma.event.count({ where }),
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

export async function getIcalEvent(eventId: string): Promise<string> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
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
  if (event.status === 'CANCELLED') {
    throw new AppError('Event has been cancelled', 410);
  }

  const startTimeParts = event.startTime?.split(':').map(Number) ?? [9, 0];
  const endTimeParts = event.endTime?.split(':').map(Number) ?? [10, 0];
  const eventDate = new Date(event.eventDate);

  const startDate = new Date(
    Date.UTC(
      eventDate.getFullYear(),
      eventDate.getMonth(),
      eventDate.getDate(),
      startTimeParts[0],
      startTimeParts[1],
      0
    )
  );

  const endDate = new Date(
    Date.UTC(
      eventDate.getFullYear(),
      eventDate.getMonth(),
      eventDate.getDate(),
      endTimeParts[0],
      endTimeParts[1],
      0
    )
  );

  // If end <= start, add 1 hour
  if (endDate <= startDate) {
    endDate.setTime(startDate.getTime() + 3_600_000);
  }

  const location = event.isVirtual
    ? `Online: ${event.meetingLink ?? ''}`
    : (event.venue ?? '');

  return generateIcs({
    uid: event.id,
    title: event.title,
    description: `${event.opportunity.title}\n${event.description ?? ''}\n\nWeTheYuva VMS`,
    location,
    startDate,
    endDate,
    organizerName: event.opportunity.createdBy.name ?? 'WeTheYuva',
  });
}

export async function updateEvent(
  id: string,
  callerId: string,
  callerRole: string,
  callerOrgId: string | null | undefined,
  data: EventInput
) {
  const event = await prisma.event.findUnique({
    where: { id },
    include: { opportunity: true },
  });

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  const isSysAdmin = hasSystemRole(callerRole);
  const isOwner = event.opportunity.createdById === callerId;
  const isSameOrg =
    event.opportunity.organizationId &&
    callerOrgId &&
    event.opportunity.organizationId === callerOrgId;

  if (!isSysAdmin && !isOwner && !isSameOrg) {
    throw new AppError('Forbidden', 403);
  }

  const updated = await prisma.event.update({
    where: { id },
    data: {
      ...data,
      eventDate: new Date(data.eventDate),
    },
  });

  await logAudit({ userId: callerId, action: 'EVENT_UPDATE', targetId: id, targetType: 'Event' });

  return updated;
}

export async function cancelEvent(
  id: string,
  callerId: string,
  callerRole: string,
  callerOrgId: string | null | undefined
) {
  const event = await prisma.event.findUnique({
    where: { id },
    include: { opportunity: true },
  });

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  const isSysAdmin = hasSystemRole(callerRole);
  const isOwner = event.opportunity.createdById === callerId;
  const isSameOrg =
    event.opportunity.organizationId &&
    callerOrgId &&
    event.opportunity.organizationId === callerOrgId;

  if (!isSysAdmin && !isOwner && !isSameOrg) {
    throw new AppError('Forbidden', 403);
  }

  const cancelled = await prisma.event.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });

  await logAudit({
    userId: callerId,
    action: 'EVENT_DELETE',
    targetId: id,
    targetType: 'Event',
    metadata: { status: 'CANCELLED' },
  });

  return cancelled;
}

// ─── Attendance ───────────────────────────────────────────────────

export async function markAttendance(
  eventId: string,
  callerId: string,
  callerRole: string,
  callerOrgId: string | null | undefined,
  attendances: { volunteerId: string; attended: boolean }[]
) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { opportunity: true },
  });

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  const isSysAdmin = hasSystemRole(callerRole);
  const isOwner = event.opportunity.createdById === callerId;
  const isSameOrg =
    event.opportunity.organizationId &&
    callerOrgId &&
    event.opportunity.organizationId === callerOrgId;

  if (!isSysAdmin && !isOwner && !isSameOrg) {
    throw new AppError('Forbidden', 403);
  }

  // Calculate event duration in hours from "HH:MM" strings
  if (!event.startTime || !event.endTime) {
    throw new AppError('Event has no start/end time configured', 400);
  }
  const [startH, startM] = event.startTime.split(':').map(Number);
  const [endH, endM] = event.endTime.split(':').map(Number);
  const startMins = startH * 60 + startM;
  const endMins = endH * 60 + endM;
  const durationHours =
    (endMins < startMins ? endMins + 24 * 60 - startMins : endMins - startMins) / 60;

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

    // When marking attended, also set checkedInAt to prevent double-counting via self check-in
    upsertOps.push(
      prisma.attendance.upsert({
        where: { eventId_volunteerId: { eventId, volunteerId } },
        create: {
          eventId,
          volunteerId,
          applicationId,
          attended,
          ...(attended && !existing?.checkedInAt ? { checkedInAt: new Date() } : {}),
        },
        update: {
          attended,
          updatedAt: new Date(),
          ...(attended && !existing?.checkedInAt ? { checkedInAt: new Date() } : {}),
        },
      })
    );

    // Determine hour adjustment (skip if volunteer has self-checked-in/out to avoid double-counting)
    // TODO: handle hour revocation for self-checked-in volunteers (production)
    // Currently, if a volunteer self-checked-in, coordinator marking attended=false
    // does not subtract hours because the actual duration is unknown at this point.
    const hasSelfCheckIn = existing?.checkedInAt || existing?.checkedOutAt;
    if (!hasSelfCheckIn) {
      if (!existing && attended) {
        hourAdjustments.push({ userId: volunteerId, increment: durationHours });
      } else if (existing?.attended && !attended) {
        hourAdjustments.push({ userId: volunteerId, increment: -durationHours });
      } else if (existing && !existing.attended && attended) {
        hourAdjustments.push({ userId: volunteerId, increment: durationHours });
      }
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

export async function getAttendanceList(
  eventId: string,
  pagination: { page: number; limit: number }
) {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;
  const where = { eventId };
  const [data, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      skip,
      take: limit,
      include: {
        volunteer: { select: { name: true, email: true } },
      },
      orderBy: { volunteer: { name: 'asc' } },
    }),
    prisma.attendance.count({ where }),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getMyEvents(
  volunteerId: string,
  pagination: { page: number; limit: number }
) {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;
  const where = {
    opportunity: {
      applications: {
        some: { volunteerId, status: 'ACCEPTED' as const },
      },
    },
    status: { not: 'CANCELLED' as const },
  } as const;
  const [data, total] = await Promise.all([
    prisma.event.findMany({
      where: where as Prisma.EventFindManyArgs['where'],
      skip,
      take: limit,
      include: {
        opportunity: { select: { title: true } },
        attendances: { where: { volunteerId } },
      },
      orderBy: { eventDate: 'asc' },
    }),
    prisma.event.count({ where: where as Prisma.EventFindManyArgs['where'] }),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function approveAttendance(
  eventId: string,
  volunteerId: string,
  coordinatorId: string,
  coordinatorRole: string,
  coordinatorOrgId: string | null | undefined,
  data: { approvedHours: number; rating: number }
) {
  if (data.rating < 1 || data.rating > 5) throw new AppError('Rating must be between 1 and 5', 400);
  if (data.approvedHours < 0) throw new AppError('Hours must be non-negative', 400);

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { opportunity: true },
  });
  if (!event) throw new AppError('Event not found', 404);

  const isSysAdmin = hasSystemRole(coordinatorRole);
  const isOwner = event.opportunity.createdById === coordinatorId;
  const isSameOrg = event.opportunity.organizationId && coordinatorOrgId && event.opportunity.organizationId === coordinatorOrgId;
  if (!isSysAdmin && !isOwner && !isSameOrg) throw new AppError('Forbidden', 403);

  const attendance = await prisma.attendance.findUnique({
    where: { eventId_volunteerId: { eventId, volunteerId } },
  });
  if (!attendance) throw new AppError('Attendance record not found', 404);
  if (!attendance.checkedInAt) throw new AppError('Volunteer has not checked in', 400);
  if (attendance.approvedAt) throw new AppError('Hours already approved', 400);

  const rawHours = attendance.checkedOutAt
    ? Math.min(Math.max(0, (attendance.checkedOutAt.getTime() - attendance.checkedInAt.getTime()) / 3_600_000), 16)
    : 0;

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.attendance.update({
      where: { eventId_volunteerId: { eventId, volunteerId } },
      data: {
        approvedHours: data.approvedHours,
        rating: data.rating,
        approvedById: coordinatorId,
        approvedAt: new Date(),
      },
    });

    const hoursDiff = data.approvedHours - rawHours;
    if (Math.abs(hoursDiff) > 0.01) {
      await tx.volunteerProfile.update({
        where: { userId: volunteerId },
        data: { totalHours: { increment: hoursDiff } },
      });
    }

    return updated;
  });

  return result;
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
    const updated = await prisma.event.findUnique({ where: { id: eventId } });
    if (!updated?.qrToken || !updated?.qrExpiresAt) {
      throw new AppError('Failed to generate QR token', 500);
    }
    return {
      token: updated.qrToken,
      expiresAt: updated.qrExpiresAt,
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

  // Allow check-in within 12 hours before/after event date (24-hour window)
  const now = new Date();
  const eventDate = new Date(event.eventDate);
  const checkInWindow = 12 * 60 * 60 * 1000;
  if (now.getTime() < eventDate.getTime() - checkInWindow) {
    throw new AppError('Event is too far in the future for check-in', 400);
  }
  if (now.getTime() > eventDate.getTime() + checkInWindow) {
    throw new AppError('Event has already passed the check-in window', 400);
  }

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

  const result = await prisma.attendance.upsert({
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

  try {
    await onEventCheckIn(volunteerId, eventId);
  } catch (err) {
    logger.warn('Failed to award check-in points/badges', { error: (err as Error).message });
  }

  return result;
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
  const rawHours = (now.getTime() - attendance.checkedInAt.getTime()) / 3_600_000;
  // TODO: remove 16h cap in production — should use event duration instead
  const hoursWorked = Math.min(Math.max(0, rawHours), 16);

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

  try {
    await onEventCheckOut(volunteerId, eventId, hoursWorked);
  } catch (err) {
    logger.warn('Failed to award check-out points/badges', { error: (err as Error).message });
  }

  return updated;
}

function sanitizeCsvCell(value: string): string {
  const escaped = value.replace(/"/g, '""');
  if (/^[=+\-@]/.test(escaped)) {
    return `"'${escaped}"`;
  }
  return `"${escaped}"`;
}

export async function exportEventsCsv(callerOrgId: string | null | undefined) {
  const where = callerOrgId ? { opportunity: { organizationId: callerOrgId } } : {};
  const events = await prisma.event.findMany({
    where,
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
        sanitizeCsvCell(e.title),
        sanitizeCsvCell(e.opportunity.title),
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
