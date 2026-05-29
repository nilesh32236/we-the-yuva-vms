import type { NextFunction, Request, Response } from 'express';
import * as service from './stories.service';

export async function createStoryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const story = await service.createStory(req.user!.id, req.body);
    res.status(201).json(story);
  } catch (err) {
    next(err);
  }
}

export async function listPublishedStoriesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const result = await service.getPublishedStories(page, limit);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getStoryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const story = await service.getStoryById(req.params.id);
    res.status(200).json(story);
  } catch (err) {
    next(err);
  }
}

export async function updateStoryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const story = await service.updateStory(req.params.id, req.user!.id, req.body);
    res.status(200).json(story);
  } catch (err) {
    next(err);
  }
}

export async function deleteStoryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteStory(req.params.id, req.user!.id, req.user!.role);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function moderateStoryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const story = await service.moderateStory(req.params.id, req.user!.id, req.user!.role, req.body.published);
    res.status(200).json(story);
  } catch (err) {
    next(err);
  }
}

export async function listAllStoriesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const result = await service.listAllStories(page, limit);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
