import { type IRouter, Router } from 'express';
import { AttendanceSchema, CheckInSchema, CheckOutSchema, EventSchema } from '@/shared';
import { requireAuth } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { Permissions } from '../../shared/permissions';
import { validate } from '../../middleware/validate.middleware';
import {
  cancelEventHandler,
  checkInHandler,
  checkOutHandler,
  createEventHandler,
  exportEventsCsvHandler,
  getAttendanceListHandler,
  getEventHandler,
  getEventQrCodeHandler,
  listAllEventsHandler,
  listEventsByOpportunityHandler,
  markAttendanceHandler,
  updateEventHandler,
} from './events.controller';

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
opportunityEventsRouter.get('/', requireAuth, listEventsByOpportunityHandler);

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
eventsRouter.get('/', requireAuth, listAllEventsHandler);

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
eventsRouter.get('/:id', requireAuth, getEventHandler);

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
eventsRouter.delete('/:id', requireAuth, requirePermission(Permissions.EVENT_EDIT), cancelEventHandler);

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
