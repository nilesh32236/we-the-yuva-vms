import type { NextFunction, Request, Response } from 'express';
import { completeLesson, getCourse, listCourses, seedCoursesIfEmpty } from './training.service';

export async function listCoursesHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await seedCoursesIfEmpty();
    const courses = await listCourses(req.user!.id);
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
