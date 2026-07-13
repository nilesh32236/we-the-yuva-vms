import { type IRouter, Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { Permissions } from '../../shared/permissions';
import { getMessagesHandler, sendMessageHandler } from './chat.controller';

export const chatRouter: IRouter = Router();

const SendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long'),
});

const ChatQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
});

chatRouter.get(
  '/:opportunityId',
  requireAuth,
  requirePermission(Permissions.CHAT_READ),
  validate(ChatQuerySchema),
  getMessagesHandler
);

chatRouter.post(
  '/:opportunityId',
  requireAuth,
  requirePermission(Permissions.CHAT_SEND),
  validate(SendMessageSchema),
  sendMessageHandler
);
