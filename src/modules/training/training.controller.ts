import type { NextFunction, Request, Response } from 'express';
import {
  completeLesson,
  createCourse,
  createLesson,
  deleteCourse,
  deleteLesson,
  getCourse,
  listCourses,
  seedCoursesIfEmpty,
  updateCourse,
  updateLesson,
} from './training.service';

export async function createCourseHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const course = await createCourse(req.user!.id, req.body);
    res.status(201).json(course);
  } catch (err) {
    next(err);
  }
}

export async function updateCourseHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const course = await updateCourse(req.params.id, req.user!.id, req.body);
    res.status(200).json(course);
  } catch (err) {
    next(err);
  }
}

export async function deleteCourseHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await deleteCourse(req.params.id, req.user!.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function createLessonHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const lesson = await createLesson(req.params.courseId, req.user!.id, req.body);
    res.status(201).json(lesson);
  } catch (err) {
    next(err);
  }
}

export async function updateLessonHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const lesson = await updateLesson(req.params.courseId, req.params.id, req.user!.id, req.body);
    res.status(200).json(lesson);
  } catch (err) {
    next(err);
  }
}

export async function deleteLessonHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await deleteLesson(req.params.courseId, req.params.id, req.user!.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function listCoursesHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await seedCoursesIfEmpty();
    const page = req.query.page ? Math.max(1, parseInt(req.query.page as string) || 1) : undefined;
    const limit = page ? Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20)) : undefined;
    const pagination = page ? { page, limit: limit! } : undefined;
    // TODO: return consistent pagination envelope even when not paginated (production)
    const courses = await listCourses(req.user!.id, pagination);
    res.status(200).json(courses);
  } catch (err) {
    next(err);
  }
}

export async function getCourseHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const course = await getCourse(req.params.id, req.user!.id);
    res.status(200).json(course);
  } catch (err) {
    next(err);
  }
}

export async function completeLessonHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await completeLesson(req.params.lessonId, req.user!.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
