import { type IRouter, Router } from 'express';
import { CreateStorySchema, ModerateStorySchema, UpdateStorySchema } from '@/shared';
import { requireAuth } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { Permissions } from '../../shared/permissions';
import {
  createStoryHandler,
  deleteStoryHandler,
  getStoryHandler,
  listAllStoriesHandler,
  listPublishedStoriesHandler,
  moderateStoryHandler,
  updateStoryHandler,
} from './stories.controller';

export const storiesRouter: IRouter = Router();

/**
 * @openapi
 * /stories/published:
 *   get:
 *     tags: [Stories]
 *     summary: List published stories (public)
 *     responses:
 *       200:
 *         description: List of published stories
 */
storiesRouter.get('/published', listPublishedStoriesHandler);

/**
 * @openapi
 * /stories/published/{id}:
 *   get:
 *     tags: [Stories]
 *     summary: Get a published story by ID (public)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Story ID
 *     responses:
 *       200:
 *         description: Story details
 */
storiesRouter.get('/published/:id', getStoryHandler);

/**
 * @openapi
 * /stories:
 *   post:
 *     tags: [Stories]
 *     summary: Create a story
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Story created
 */
storiesRouter.post(
  '/',
  requireAuth,
  requirePermission(Permissions.STORY_CREATE),
  validate(CreateStorySchema),
  createStoryHandler
);

/**
 * @openapi
 * /stories/{id}:
 *   put:
 *     tags: [Stories]
 *     summary: Update a story
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Story ID
 *     responses:
 *       200:
 *         description: Story updated
 */
storiesRouter.put(
  '/:id',
  requireAuth,
  requirePermission(Permissions.STORY_EDIT),
  validate(UpdateStorySchema),
  updateStoryHandler
);

/**
 * @openapi
 * /stories/{id}:
 *   delete:
 *     tags: [Stories]
 *     summary: Delete a story
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Story ID
 *     responses:
 *       204:
 *         description: Story deleted
 */
storiesRouter.delete(
  '/:id',
  requireAuth,
  requirePermission(Permissions.STORY_EDIT),
  deleteStoryHandler
);

/**
 * @openapi
 * /stories/all:
 *   get:
 *     tags: [Stories]
 *     summary: List all stories for moderation (Admin)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of all stories
 */
storiesRouter.get(
  '/all',
  requireAuth,
  requirePermission(Permissions.STORY_VIEW_ALL),
  listAllStoriesHandler
);

/**
 * @openapi
 * /stories/{id}/moderate:
 *   patch:
 *     tags: [Stories]
 *     summary: Moderate a story (Admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Story ID
 *     responses:
 *       200:
 *         description: Story moderated
 */
storiesRouter.patch(
  '/:id/moderate',
  requireAuth,
  requirePermission(Permissions.STORY_MODERATE),
  validate(ModerateStorySchema),
  moderateStoryHandler
);
