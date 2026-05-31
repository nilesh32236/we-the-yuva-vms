import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../training.service', () => ({
  listCourses: vi.fn(),
  getCourse: vi.fn(),
  createCourse: vi.fn(),
  updateCourse: vi.fn(),
  deleteCourse: vi.fn(),
  createLesson: vi.fn(),
  updateLesson: vi.fn(),
  deleteLesson: vi.fn(),
  completeLesson: vi.fn(),
}));

const svc = await import('../training.service');

import {
  completeLessonHandler,
  createCourseHandler,
  createLessonHandler,
  deleteCourseHandler,
  deleteLessonHandler,
  getCourseHandler,
  listCoursesHandler,
  updateCourseHandler,
  updateLessonHandler,
} from '../training.controller';

describe('training.controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      body: {},
      params: {},
      query: {},
      user: { id: 'user-1', role: 'VOLUNTEER', permissions: [], organizationId: null },
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
    next = vi.fn() as unknown as NextFunction;
  });

  it('createCourseHandler should return 201', async () => {
    vi.mocked(svc.createCourse).mockResolvedValue({ id: 'course-1' });
    await createCourseHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('updateCourseHandler should return 200', async () => {
    vi.mocked(svc.updateCourse).mockResolvedValue({ id: 'course-1' });
    req.params = { id: 'course-1' };
    await updateCourseHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('deleteCourseHandler should return 204', async () => {
    vi.mocked(svc.deleteCourse).mockResolvedValue();
    req.params = { id: 'course-1' };
    await deleteCourseHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it('createLessonHandler should return 201', async () => {
    vi.mocked(svc.createLesson).mockResolvedValue({ id: 'lesson-1' });
    req.params = { courseId: 'course-1' };
    await createLessonHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('updateLessonHandler should return 200', async () => {
    vi.mocked(svc.updateLesson).mockResolvedValue({ id: 'lesson-1' });
    req.params = { courseId: 'course-1', id: 'lesson-1' };
    await updateLessonHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('deleteLessonHandler should return 204', async () => {
    vi.mocked(svc.deleteLesson).mockResolvedValue();
    req.params = { courseId: 'course-1', id: 'lesson-1' };
    await deleteLessonHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it('listCoursesHandler should return 200', async () => {
    vi.mocked(svc.listCourses).mockResolvedValue([]);
    await listCoursesHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getCourseHandler should return 200', async () => {
    vi.mocked(svc.getCourse).mockResolvedValue({ id: 'course-1' });
    req.params = { id: 'course-1' };
    await getCourseHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('completeLessonHandler should return 200', async () => {
    vi.mocked(svc.completeLesson).mockResolvedValue({
      lessonId: 'lesson-1',
      courseCompleted: false,
    });
    req.params = { lessonId: 'lesson-1' };
    await completeLessonHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
