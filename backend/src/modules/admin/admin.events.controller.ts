import type { NextFunction, Request, Response } from 'express';
import * as eventsService from './admin.events.service';

export async function adminListEventsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit as string, 10) || 20));

    const result = await eventsService.listEvents(page, limit);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function adminGetEventHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const event = await eventsService.getEvent(req.params.id);

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    res.status(200).json(event);
  } catch (err) {
    next(err);
  }
}
