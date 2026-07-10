import { type IRouter, Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { Permissions } from '../../shared/permissions';
import {
  CreateMentorshipSchema,
  ReviewMentorshipSchema,
} from '../../shared/schemas/mentorship.schemas';
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
  listPendingRequestsHandler
);
mentorshipRouter.get(
  '/requests',
  requireAuth,
  requirePermission(Permissions.MENTORSHIP_CREATE),
  listMyRequestsHandler
);
mentorshipRouter.get(
  '/mentors',
  requireAuth,
  requirePermission(Permissions.MENTORSHIP_CREATE),
  listMyMentorsHandler
);
mentorshipRouter.get(
  '/mentees',
  requireAuth,
  requirePermission(Permissions.MENTORSHIP_CREATE),
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
