import type { NextFunction, Request, Response } from 'express';
import {
  requestMentorship,
  listPendingRequests,
  listMyRequests,
  reviewMentorshipRequest,
  listMyMentors,
  listMyMentees,
  completeMentorship,
  cancelMentorshipRequest,
} from './mentorship.service';

export async function requestMentorshipHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { menteeId } = req.body;
    const mentorship = await requestMentorship(req.user!.id, menteeId);
    res.status(201).json(mentorship);
  } catch (err) {
    next(err);
  }
}

export async function listPendingRequestsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const requests = await listPendingRequests(req.user!.id, page, limit);
    res.status(200).json(requests);
  } catch (err) {
    next(err);
  }
}

export async function listMyRequestsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const requests = await listMyRequests(req.user!.id, page, limit);
    res.status(200).json(requests);
  } catch (err) {
    next(err);
  }
}

export async function reviewMentorshipRequestHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { status } = req.body;
    const result = await reviewMentorshipRequest(req.params.id, req.user!.id, status);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function listMyMentorsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const mentors = await listMyMentors(req.user!.id, page, limit);
    res.status(200).json(mentors);
  } catch (err) {
    next(err);
  }
}

export async function listMyMenteesHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const mentees = await listMyMentees(req.user!.id, page, limit);
    res.status(200).json(mentees);
  } catch (err) {
    next(err);
  }
}

export async function completeMentorshipHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await completeMentorship(req.params.id, req.user!.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function cancelMentorshipRequestHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await cancelMentorshipRequest(req.params.id, req.user!.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
