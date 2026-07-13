import type { NextFunction, Request, Response } from 'express';
import * as service from './blog.service';

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const post = await service.createPost(req.user!.id, req.body);
    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
}

export async function listPublishedHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit as string, 10) || 20));
    const result = await service.getPublishedPosts(page, limit);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getPublishedBySlugHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const param = req.params.param;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(param);
    const post = isUuid ? await service.getPostById(param) : await service.getPostBySlug(param);
    res.status(200).json(post);
  } catch (err) {
    next(err);
  }
}

export async function updateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const post = await service.updatePost(req.params.id, req.user!.id, req.body, req.user!.role);
    res.status(200).json(post);
  } catch (err) {
    next(err);
  }
}

export async function publishHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const post = await service.publishPost(req.params.id, req.user!.id, req.user!.role);
    res.status(200).json(post);
  } catch (err) {
    next(err);
  }
}

export async function archiveHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const post = await service.archivePost(req.params.id, req.user!.id, req.user!.role);
    res.status(200).json(post);
  } catch (err) {
    next(err);
  }
}

export async function deleteHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deletePost(req.params.id, req.user!.id, req.user!.role);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function listAllHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit as string, 10) || 20));
    const result = await service.listAllPosts(page, limit);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
