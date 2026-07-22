import { type IRouter, Router } from 'express';
import { z } from 'zod';
import {
  AttendanceSchema,
  CheckInSchema,
  CheckOutSchema,
  EventSchema,
  EventSeriesSchema,
  EventSeriesUpdateSchema,
} from '@/shared';
import { requireAuth } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { Permissions } from '../../shared/permissions';
import {
  approveAttendanceHandler,
  cancelEventHandler,
  checkInHandler,
  checkOutHandler,
  createEventHandler,
  createEventSeriesHandler,
  deleteEventSeriesHandler,
  downloadIcalHandler,
  exportEventsCsvHandler,
  generateEventsHandler,
  getAttendanceListHandler,
  getEventHandler,
  getEventQrCodeHandler,
  getEventSeriesByIdHandler,
  listAllEventsHandler,
  listEventSeriesHandler,
  listEventsByOpportunityHandler,
  markAttendanceHandler,
  updateEventHandler,
  updateEventSeriesHandler,
} from './events.controller';

const ApproveAttendanceSchema = z.object({
  approvedHours: z.number().positive('Hours must be positive').max(24, 'Hours cannot exceed 24'),
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
});

const EventIdParamsSchema = z.object({
  params: z.object({ id: z.string().min(1, 'Event ID is required') }),
});

// ─── Router: /opportunities/:opportunityId/events ─────────────────
// Mount at: /api/v1/opportunities/:opportunityId/events

export const opportunityEventsRouter: IRouter = Router({ mergeParams: true });

/**
 * @openapi
 * /opportunities/{opportunityId}/events:
 *   post:
 *     tags: [Events]
 *     summary: Create an event for an opportunity
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: opportunityId
 *         required: true
 *         schema:
 *           type: string
 *         description: Opportunity ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               date: { type: string, format: date }
 *     responses:
 *       201:
 *         description: Event created
 */
opportunityEventsRouter.post(
  '/',
  requireAuth,
  requirePermission(Permissions.EVENT_CREATE),
  validate(EventSchema),
  createEventHandler
);

/**
 * @openapi
 * /opportunities/{opportunityId}/events:
 *   get:
 *     tags: [Events]
 *     summary: List events for an opportunity
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: opportunityId
 *         required: true
 *         schema:
 *           type: string
 *         description: Opportunity ID
 *     responses:
 *       200:
 *         description: List of events
 */
opportunityEventsRouter.get(
  '/',
  requireAuth,
  requirePermission(Permissions.EVENT_VIEW),
  listEventsByOpportunityHandler
);

// ─── Router: /events/* and /users/me/events ───────────────────────
// Mount at: /api/v1/events  (for /events/* routes)
// Mount at: /api/v1/users   (for /me/events route)

export const eventsRouter: IRouter = Router();

/**
 * @openapi
 * /events:
 *   get:
 *     tags: [Events]
 *     summary: List all events (paginated)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of events
 */
eventsRouter.get('/', requireAuth, requirePermission(Permissions.EVENT_VIEW), listAllEventsHandler);

/**
 * @openapi
 * /events/export/csv:
 *   get:
 *     tags: [Events]
 *     summary: Export events as CSV
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: CSV export of events
 */
eventsRouter.get(
  '/export/csv',
  requireAuth,
  requirePermission(Permissions.EVENT_MANAGE),
  exportEventsCsvHandler
);

/**
 * @openapi
 * /events/{id}:
 *   get:
 *     tags: [Events]
 *     summary: Get event details
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event details
 */
eventsRouter.get(
  '/:id/ical',
  requireAuth,
  requirePermission(Permissions.EVENT_VIEW),
  downloadIcalHandler
);

eventsRouter.get('/:id', requireAuth, requirePermission(Permissions.EVENT_VIEW), validate(EventIdParamsSchema), getEventHandler);

/**
 * @openapi
 * /events/{id}/qr:
 *   get:
 *     tags: [Events]
 *     summary: Get QR code token for event check-in
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: QR code token
 */
eventsRouter.get(
  '/:id/qr',
  requireAuth,
  requirePermission(Permissions.EVENT_MANAGE),
  getEventQrCodeHandler
);

/**
 * @openapi
 * /events/{id}/checkin:
 *   post:
 *     tags: [Events]
 *     summary: Volunteer self check-in to event
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Check-in successful
 */
eventsRouter.post(
  '/:id/checkin',
  requireAuth,
  requirePermission(Permissions.EVENT_CHECKIN),
  validate(CheckInSchema),
  checkInHandler
);

/**
 * @openapi
 * /events/{id}/checkout:
 *   post:
 *     tags: [Events]
 *     summary: Volunteer self check-out from event
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Check-out successful
 */
eventsRouter.post(
  '/:id/checkout',
  requireAuth,
  requirePermission(Permissions.EVENT_CHECKIN),
  validate(CheckOutSchema),
  checkOutHandler
);

/**
 * @openapi
 * /events/{id}:
 *   put:
 *     tags: [Events]
 *     summary: Update an event
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               date: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Event updated
 */
eventsRouter.put(
  '/:id',
  requireAuth,
  requirePermission(Permissions.EVENT_EDIT),
  validate(EventSchema),
  updateEventHandler
);

/**
 * @openapi
 * /events/{id}:
 *   delete:
 *     tags: [Events]
 *     summary: Cancel an event (soft delete)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event cancelled
 */
eventsRouter.delete(
  '/:id',
  requireAuth,
  requirePermission(Permissions.EVENT_EDIT),
  cancelEventHandler
);

/**
 * @openapi
 * /events/{id}/attendance:
 *   post:
 *     tags: [Events]
 *     summary: Mark attendance for an event
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId: { type: string }
 *               status: { type: string }
 *     responses:
 *       200:
 *         description: Attendance marked
 */
eventsRouter.post(
  '/:id/attendance',
  requireAuth,
  requirePermission(Permissions.EVENT_MANAGE),
  validate(AttendanceSchema),
  markAttendanceHandler
);

/**
 * @openapi
 * /events/{id}/attendance:
 *   get:
 *     tags: [Events]
 *     summary: Get attendance list for an event
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: List of attendance records
 */
eventsRouter.get(
  '/:id/attendance',
  requireAuth,
  requirePermission(Permissions.EVENT_MANAGE),
  getAttendanceListHandler
);

eventsRouter.post(
  '/:id/attendance/:volunteerId/approve',
  requireAuth,
  requirePermission(Permissions.EVENT_MANAGE),
  validate(ApproveAttendanceSchema),
  approveAttendanceHandler
);

// ─── Router: /opportunities/:opportunityId/event-series ───────────
// Mount at: /api/v1/opportunities/:opportunityId/event-series

export const opportunityEventSeriesRouter: IRouter = Router({ mergeParams: true });

opportunityEventSeriesRouter.post(
  '/',
  requireAuth,
  requirePermission(Permissions.EVENT_CREATE),
  validate(EventSeriesSchema),
  createEventSeriesHandler
);

opportunityEventSeriesRouter.get(
  '/',
  requireAuth,
  requirePermission(Permissions.EVENT_VIEW),
  listEventSeriesHandler
);

// ─── Router: /event-series/:id ───────────────────────────────────
// Mount at: /api/v1/event-series

export const eventSeriesRouter: IRouter = Router();

eventSeriesRouter.get(
  '/:id',
  requireAuth,
  requirePermission(Permissions.EVENT_VIEW),
  getEventSeriesByIdHandler
);

eventSeriesRouter.put(
  '/:id',
  requireAuth,
  requirePermission(Permissions.EVENT_EDIT),
  validate(EventSeriesUpdateSchema),
  updateEventSeriesHandler
);

eventSeriesRouter.delete(
  '/:id',
  requireAuth,
  requirePermission(Permissions.EVENT_EDIT),
  deleteEventSeriesHandler
);

eventSeriesRouter.post(
  '/:id/generate',
  requireAuth,
  requirePermission(Permissions.EVENT_EDIT),
  generateEventsHandler
);
