import { type IRouter, Router } from 'express';
import { z } from 'zod';
import {
  ApplicationStatusSchema,
  ApplySchema,
  OpportunitySchema,
  UpdateOpportunitySchema,
} from '@/shared';
import { requireAuth } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { Permissions } from '../../shared/permissions';
import {
  applyHandler,
  closeOpportunityHandler,
  createOpportunityHandler,
  getOpportunityHandler,
  getPublicOpportunityHandler,
  listApplicationsHandler,
  listMyApplicationsHandler,
  listOpportunitiesHandler,
  listPublicOpportunitiesHandler,
  recommendedHandler,
  updateApplicationStatusHandler,
  updateOpportunityHandler,
  withdrawApplicationHandler,
} from './opportunities.controller';

const ListOpportunitiesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    category: z.string().optional(),
    skills: z.string().optional(),
    isRemote: z.enum(['true', 'false']).optional(),
    locationId: z.string().optional(),
    search: z.string().optional(),
    organizationId: z.string().optional(),
  }),
});

const ListApplicationsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
});

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
  requirePermission(Permissions.OPPORTUNITY_CREATE),
  validate(OpportunitySchema),
  createOpportunityHandler
);

opportunitiesRouter.get(
  '/recommended',
  requireAuth,
  requirePermission(Permissions.OPPORTUNITY_VIEW),
  recommendedHandler
);

opportunitiesRouter.get(
  '/public',
  validate(ListOpportunitiesQuerySchema),
  listPublicOpportunitiesHandler
);
opportunitiesRouter.get('/public/:id', getPublicOpportunityHandler);

opportunitiesRouter.get(
  '/',
  requireAuth,
  requirePermission(Permissions.OPPORTUNITY_VIEW),
  validate(ListOpportunitiesQuerySchema),
  listOpportunitiesHandler
);

opportunitiesRouter.get(
  '/my-applications',
  requireAuth,
  requirePermission(Permissions.OPPORTUNITY_APPLY),
  validate(ListApplicationsQuerySchema),
  listMyApplicationsHandler
);

opportunitiesRouter.delete(
  '/applications/:id',
  requireAuth,
  requirePermission(Permissions.OPPORTUNITY_APPLY),
  withdrawApplicationHandler
);

opportunitiesRouter.get(
  '/:id',
  requireAuth,
  requirePermission(Permissions.OPPORTUNITY_VIEW),
  getOpportunityHandler
);

opportunitiesRouter.put(
  '/:id',
  requireAuth,
  requirePermission(Permissions.OPPORTUNITY_EDIT),
  validate(UpdateOpportunitySchema),
  updateOpportunityHandler
);

opportunitiesRouter.delete(
  '/:id',
  requireAuth,
  requirePermission(Permissions.OPPORTUNITY_EDIT),
  closeOpportunityHandler
);

opportunitiesRouter.post(
  '/:id/apply',
  requireAuth,
  requirePermission(Permissions.OPPORTUNITY_APPLY),
  validate(ApplySchema),
  applyHandler
);

opportunitiesRouter.get(
  '/:id/applications',
  requireAuth,
  requirePermission(Permissions.OPPORTUNITY_MANAGE),
  validate(ListApplicationsQuerySchema),
  listApplicationsHandler
);

opportunitiesRouter.patch(
  '/:id/applications/:appId',
  requireAuth,
  requirePermission(Permissions.OPPORTUNITY_MANAGE),
  validate(ApplicationStatusSchema),
  updateApplicationStatusHandler
);
