import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../middleware/error.middleware';
import * as service from './chat.service';

export async function getMessagesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit as string, 10) || 50));
    const result = await service.getMessages(req.params.opportunityId, page, limit);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function sendMessageHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) return next(new AppError('Unauthorized', 401));
    const { content } = req.body;
    const message = await service.sendMessage(req.params.opportunityId, req.user.id, content);
    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
}
