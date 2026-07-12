import type { NextFunction, Request, Response } from 'express';

import {
  approveAttendance,
  cancelEvent,
  checkIn,
  checkOut,
  createEvent,
  exportEventsCsv,
  getAttendanceList,
  getAttendanceListAll,
  getEventById,
  getIcalEvent,
  getMyEvents,
  getOrCreateEventQrToken,
  listAllEvents,
  listEventsByOpportunity,
  markAttendance,
  updateEvent,
} from './events.service';

// ─── Event Handlers ───────────────────────────────────────────────

export async function createEventHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const event = await createEvent(
      req.params.opportunityId,
      req.user!.id,
      req.user!.role,
      req.user!.organizationId,
      req.body
    );
    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
}

export async function listEventsByOpportunityHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = req.query.page
      ? Math.max(1, Number.parseInt(req.query.page as string, 10) || 1)
      : undefined;
    const limit = page
      ? Math.min(100, Math.max(1, Number.parseInt(req.query.limit as string, 10) || 20))
      : undefined;
    const pagination = page ? { page, limit: limit! } : undefined;
    const events = await listEventsByOpportunity(req.params.opportunityId, pagination);
    res.status(200).json(pagination ? events : { data: events });
  } catch (err) {
    next(err);
  }
}

export async function listAllEventsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit as string, 10) || 20));
    const result = await listAllEvents(req.user!.organizationId, { page, limit });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getEventHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const event = await getEventById(req.params.id);
    res.status(200).json(event);
  } catch (err) {
    next(err);
  }
}

export async function updateEventHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const event = await updateEvent(
      req.params.id,
      req.user!.id,
      req.user!.role,
      req.user!.organizationId,
      req.body
    );
    res.status(200).json(event);
  } catch (err) {
    next(err);
  }
}

export async function cancelEventHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await cancelEvent(req.params.id, req.user!.id, req.user!.role, req.user!.organizationId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// ─── QR Code Handlers ────────────────────────────────────────────

export async function getEventQrCodeHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const force = req.query.force === 'true';
    const qrData = await getOrCreateEventQrToken(req.params.id, force);
    res.status(200).json(qrData);
  } catch (err) {
    next(err);
  }
}

// ─── Attendance Handlers ──────────────────────────────────────────

export async function markAttendanceHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const count = await markAttendance(
      req.params.id,
      req.user!.id,
      req.user!.role,
      req.user!.organizationId,
      req.body.attendances
    );
    res.status(200).json({ attended: count });
  } catch (err) {
    next(err);
  }
}

export async function getAttendanceListHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (req.query.listAll === 'true') {
      const list = await getAttendanceListAll(req.params.id);
      res.status(200).json({ data: list });
      return;
    }
    const page = Math.max(1, Number.parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit as string, 10) || 20));
    const list = await getAttendanceList(req.params.id, { page, limit });
    res.status(200).json(list);
  } catch (err) {
    next(err);
  }
}

export async function approveAttendanceHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { approvedHours, rating } = req.body;
    const record = await approveAttendance(
      req.params.id,
      req.params.volunteerId,
      req.user!.id,
      req.user!.role,
      req.user!.organizationId,
      { approvedHours: Number(approvedHours), rating: Number(rating) }
    );
    res.status(200).json(record);
  } catch (err) {
    next(err);
  }
}

// ─── Volunteer "My Events" Handler ───────────────────────────────

export async function getMyEventsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit as string, 10) || 20));
    const events = await getMyEvents(req.user!.id, { page, limit });
    res.status(200).json(events);
  } catch (err) {
    next(err);
  }
}

export async function checkInHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { lat, lng, qrToken } = req.body;
    const location =
      lat != null && lng != null ? { lat: Number(lat), lng: Number(lng) } : undefined;
    const record = await checkIn(req.params.id, req.user!.id, location, qrToken);
    res.status(200).json(record);
  } catch (err) {
    next(err);
  }
}

export async function checkOutHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { lat, lng } = req.body;
    const location =
      lat != null && lng != null ? { lat: Number(lat), lng: Number(lng) } : undefined;
    const record = await checkOut(req.params.id, req.user!.id, location);
    res.status(200).json(record);
  } catch (err) {
    next(err);
  }
}

export async function exportEventsCsvHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const csv = await exportEventsCsv(req.user!.organizationId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="events-export.csv"');
    res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
}

export async function downloadIcalHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const ics = await getIcalEvent(req.params.id);
    const filename = `event-${req.params.id.slice(0, 8)}.ics`;
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(ics);
  } catch (err) {
    next(err);
  }
}
