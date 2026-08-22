import { Router } from 'express';
import { LinkStorySchema, StartChallengeSchema } from '@/shared';
import { requireAuth } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { Permissions } from '../../shared/permissions';
import {
  adminExportChallengesHandler,
  adminListChallengesHandler,
  checkInHandler,
  getMyChallengeHandler,
  linkStoryHandler,
  startChallengeHandler,
} from './kindness-challenge.controller';

export const kindnessRouter: Router = Router();

kindnessRouter.use(requireAuth);

/**
 * @openapi
 * /kindness-challenge:
 *   post:
 *     tags: [KindnessChallenge]
 *     summary: Start the 7-Day Kindness Challenge
 *     security: [{ bearerAuth: [] }]
 */
kindnessRouter.post('/', requirePermission(Permissions.CHALLENGE_PARTICIPATE), validate(StartChallengeSchema), startChallengeHandler);

/**
 * @openapi
 * /kindness-challenge/me:
 *   get:
 *     tags: [KindnessChallenge]
 *     summary: My challenge state with computed view
 *     security: [{ bearerAuth: [] }]
 */
kindnessRouter.get('/me', requirePermission(Permissions.CHALLENGE_PARTICIPATE), getMyChallengeHandler);

kindnessRouter.post('/check-in', requirePermission(Permissions.CHALLENGE_PARTICIPATE), checkInHandler);

kindnessRouter.patch('/link-story', requirePermission(Permissions.CHALLENGE_PARTICIPATE), validate(LinkStorySchema), linkStoryHandler);

kindnessRouter.get('/admin', requirePermission(Permissions.CHALLENGE_VIEW_ALL), adminListChallengesHandler);

kindnessRouter.get('/admin/export', requirePermission(Permissions.CHALLENGE_VIEW_ALL), adminExportChallengesHandler);
