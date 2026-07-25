import { type IRouter, Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { Permissions } from '../../shared/permissions';
import {
  CreateMentorshipSchema,
  ReviewMentorshipSchema,
} from '../../shared/schemas/mentorship.schemas';

const PaginationQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
});
import {
  requestMentorshipHandler,
  listPendingRequestsHandler,
  listMyRequestsHandler,
  reviewMentorshipRequestHandler,
  listMyMentorsHandler,
  listMyMenteesHandler,
  completeMentorshipHandler,
  cancelMentorshipRequestHandler,
} from './mentorship.controller';

export const mentorshipRouter: IRouter = Router();

mentorshipRouter.post(
  '/',
  requireAuth,
  requirePermission(Permissions.MENTORSHIP_CREATE),
  validate(CreateMentorshipSchema),
  requestMentorshipHandler
);
mentorshipRouter.get(
  '/pending',
  requireAuth,
  requirePermission(Permissions.MENTORSHIP_CREATE),
  validate(PaginationQuerySchema),
  listPendingRequestsHandler
);
mentorshipRouter.get(
  '/requests',
  requireAuth,
  requirePermission(Permissions.MENTORSHIP_CREATE),
  validate(PaginationQuerySchema),
  listMyRequestsHandler
);
mentorshipRouter.get(
  '/mentors',
  requireAuth,
  requirePermission(Permissions.MENTORSHIP_CREATE),
  validate(PaginationQuerySchema),
  listMyMentorsHandler
);
mentorshipRouter.get(
  '/mentees',
  requireAuth,
  requirePermission(Permissions.MENTORSHIP_CREATE),
  validate(PaginationQuerySchema),
  listMyMenteesHandler
);
mentorshipRouter.patch(
  '/:id',
  requireAuth,
  requirePermission(Permissions.MENTORSHIP_MANAGE),
  validate(ReviewMentorshipSchema),
  reviewMentorshipRequestHandler
);
mentorshipRouter.patch(
  '/:id/complete',
  requireAuth,
  requirePermission(Permissions.MENTORSHIP_MANAGE),
  completeMentorshipHandler
);
mentorshipRouter.delete(
  '/:id',
  requireAuth,
  requirePermission(Permissions.MENTORSHIP_CREATE),
  cancelMentorshipRequestHandler
);
