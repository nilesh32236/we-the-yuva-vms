import { type IRouter, Router } from 'express';
import { ApplicationStatusSchema, ApplySchema, OpportunitySchema } from '@/shared';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  applyHandler,
  closeOpportunityHandler,
  createOpportunityHandler,
  getOpportunityHandler,
  listApplicationsHandler,
  listMyApplicationsHandler,
  listOpportunitiesHandler,
  recommendedHandler,
  updateApplicationStatusHandler,
  updateOpportunityHandler,
  withdrawApplicationHandler,
} from './opportunities.controller';

export const opportunitiesRouter: IRouter = Router();

/**
 * @openapi
 * /opportunities:
 *   post:
 *     tags: [Opportunities]
 *     summary: Create a new opportunity
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Opportunity created
 */
opportunitiesRouter.post(
  '/',
  requireAuth,
  requireRole('COORDINATOR', 'ADMIN'),
  validate(OpportunitySchema),
  createOpportunityHandler
);

/**
 * @openapi
 * /opportunities/recommended:
 *   get:
 *     tags: [Opportunities]
 *     summary: Get recommended opportunities for volunteer
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Recommended opportunities retrieved
 */
opportunitiesRouter.get('/recommended', requireAuth, requireRole('VOLUNTEER'), recommendedHandler);

/**
 * @openapi
 * /opportunities:
 *   get:
 *     tags: [Opportunities]
 *     summary: List all opportunities
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of opportunities
 */
opportunitiesRouter.get('/', requireAuth, listOpportunitiesHandler);

/**
 * @openapi
 * /opportunities/my-applications:
 *   get:
 *     tags: [Opportunities]
 *     summary: List volunteer's own applications
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of my applications
 */
opportunitiesRouter.get(
  '/my-applications',
  requireAuth,
  requireRole('VOLUNTEER'),
  listMyApplicationsHandler
);

/**
 * @openapi
 * /applications/{id}:
 *   delete:
 *     tags: [Opportunities]
 *     summary: Withdraw a pending application
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID
 *     responses:
 *       204:
 *         description: Application withdrawn
 */
opportunitiesRouter.delete(
  '/applications/:id',
  requireAuth,
  requireRole('VOLUNTEER'),
  withdrawApplicationHandler
);

/**
 * @openapi
 * /opportunities/{id}:
 *   get:
 *     tags: [Opportunities]
 *     summary: Get opportunity by ID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Opportunity ID
 *     responses:
 *       200:
 *         description: Opportunity details
 */
opportunitiesRouter.get('/:id', requireAuth, getOpportunityHandler);

/**
 * @openapi
 * /opportunities/{id}:
 *   put:
 *     tags: [Opportunities]
 *     summary: Update an opportunity
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
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
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Opportunity updated
 */
opportunitiesRouter.put(
  '/:id',
  requireAuth,
  requireRole('COORDINATOR', 'ADMIN'),
  validate(OpportunitySchema),
  updateOpportunityHandler
);

/**
 * @openapi
 * /opportunities/{id}:
 *   delete:
 *     tags: [Opportunities]
 *     summary: Close an opportunity (soft delete)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Opportunity ID
 *     responses:
 *       200:
 *         description: Opportunity closed
 */
opportunitiesRouter.delete(
  '/:id',
  requireAuth,
  requireRole('COORDINATOR', 'ADMIN'),
  closeOpportunityHandler
);

/**
 * @openapi
 * /opportunities/{id}/apply:
 *   post:
 *     tags: [Opportunities]
 *     summary: Apply to an opportunity
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Opportunity ID
 *     responses:
 *       201:
 *         description: Application submitted
 */
opportunitiesRouter.post(
  '/:id/apply',
  requireAuth,
  requireRole('VOLUNTEER'),
  validate(ApplySchema),
  applyHandler
);

/**
 * @openapi
 * /opportunities/{id}/applications:
 *   get:
 *     tags: [Opportunities]
 *     summary: List applications for an opportunity
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Opportunity ID
 *     responses:
 *       200:
 *         description: List of applications
 */
opportunitiesRouter.get(
  '/:id/applications',
  requireAuth,
  requireRole('COORDINATOR', 'ADMIN'),
  listApplicationsHandler
);

/**
 * @openapi
 * /opportunities/{id}/applications/{appId}:
 *   patch:
 *     tags: [Opportunities]
 *     summary: Update application status
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Opportunity ID
 *       - in: path
 *         name: appId
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string }
 *     responses:
 *       200:
 *         description: Application status updated
 */
opportunitiesRouter.patch(
  '/:id/applications/:appId',
  requireAuth,
  requireRole('COORDINATOR', 'ADMIN'),
  validate(ApplicationStatusSchema),
  updateApplicationStatusHandler
);
