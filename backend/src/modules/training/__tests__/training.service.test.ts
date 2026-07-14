import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/queue', () => ({ notificationsQueue: null }));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    course: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      createMany: vi.fn(),
    },
    lesson: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    lessonCompletion: { upsert: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    courseProgress: { upsert: vi.fn() },
  },
}));

vi.mock('@/lib/audit', () => ({ logAudit: vi.fn() }));

const { prisma } = await import('@/lib/prisma');

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
} from '../training.service';

describe('training.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCourse', () => {
    it('should create a course', async () => {
      vi.mocked(prisma.course.create).mockResolvedValue({
        id: 'course-1',
        title: 'Test Course',
      } as never);
      const result = await createCourse('user-1', {
        title: 'Test Course',
        description: 'Desc',
        category: 'ORIENTATION',
      });
      expect(result.title).toBe('Test Course');
    });
  });

  describe('getCourse', () => {
    it('should return course with lesson completion status', async () => {
      vi.mocked(prisma.course.findUnique).mockResolvedValue({
        id: 'course-1',
        title: 'Test',
        lessons: [
          {
            id: 'l1',
            title: 'L1',
            content: 'C',
            type: 'TEXT',
            order: 1,
            courseId: 'course-1',
            completions: [{ lessonId: 'l1' }],
          },
        ],
        progress: [],
      } as never);
      vi.mocked(prisma.lessonCompletion.findMany).mockResolvedValue([{ lessonId: 'l1' }] as never);

      const result = await getCourse('course-1', 'user-1');
      expect(result.lessons[0].completed).toBe(true);
    });
  });

  describe('completeLesson', () => {
    it('should mark lesson complete', async () => {
      vi.mocked(prisma.lesson.findUnique).mockResolvedValue({
        id: 'l1',
        courseId: 'course-1',
      } as never);
      vi.mocked(prisma.lessonCompletion.upsert).mockResolvedValue({} as never);
      vi.mocked(prisma.lesson.count).mockResolvedValue(3);
      vi.mocked(prisma.lessonCompletion.count).mockResolvedValue(2);
      vi.mocked(prisma.courseProgress.upsert).mockResolvedValue({} as never);

      const result = await completeLesson('l1', 'user-1');
      expect(result.lessonId).toBe('l1');
      expect(result.courseCompleted).toBe(false);
    });

    it('should mark course completed when all lessons done', async () => {
      vi.mocked(prisma.lesson.findUnique).mockResolvedValue({
        id: 'l1',
        courseId: 'course-1',
      } as never);
      vi.mocked(prisma.lessonCompletion.upsert).mockResolvedValue({} as never);
      vi.mocked(prisma.lesson.count).mockResolvedValue(3);
      vi.mocked(prisma.lessonCompletion.count).mockResolvedValue(3);
      vi.mocked(prisma.courseProgress.upsert).mockResolvedValue({} as never);

      const result = await completeLesson('l1', 'user-1');
      expect(result.courseCompleted).toBe(true);
      expect(prisma.courseProgress.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ create: expect.objectContaining({ completed: true }) })
      );
    });

    it('should throw 404 when lesson not found', async () => {
      vi.mocked(prisma.lesson.findUnique).mockResolvedValue(null);
      await expect(completeLesson('bad-id', 'user-1')).rejects.toThrow('Lesson not found');
    });
  });

  describe('updateCourse', () => {
    it('should throw 404 when course not found', async () => {
      vi.mocked(prisma.course.update).mockRejectedValue({ code: 'P2025' });
      await expect(updateCourse('bad-id', 'user-1', { title: 'New' })).rejects.toThrow(
        'Course not found'
      );
    });

    it('should update successfully', async () => {
      vi.mocked(prisma.course.findUnique).mockResolvedValue({ id: 'course-1' } as never);
      vi.mocked(prisma.course.update).mockResolvedValue({ id: 'course-1', title: 'New' } as never);
      const result = await updateCourse('course-1', 'user-1', { title: 'New' });
      expect(result.title).toBe('New');
    });
  });

  describe('deleteCourse', () => {
    it('should throw 404 when course not found', async () => {
      vi.mocked(prisma.course.delete).mockRejectedValue({ code: 'P2025' });
      await expect(deleteCourse('bad-id', 'user-1')).rejects.toThrow('Course not found');
    });

    it('should delete successfully', async () => {
      vi.mocked(prisma.course.findUnique).mockResolvedValue({ id: 'course-1' } as never);
      vi.mocked(prisma.course.delete).mockResolvedValue({} as never);
      await expect(deleteCourse('course-1', 'user-1')).resolves.toBeUndefined();
    });
  });

  describe('createLesson', () => {
    it('should throw 404 when course not found', async () => {
      vi.mocked(prisma.lesson.create).mockRejectedValue({ code: 'P2025' });
      await expect(
        createLesson('bad-id', 'user-1', { title: 'L', content: 'C', type: 'TEXT' })
      ).rejects.toThrow('Course not found');
    });

    it('should create lesson', async () => {
      vi.mocked(prisma.course.findUnique).mockResolvedValue({ id: 'course-1' } as never);
      vi.mocked(prisma.lesson.create).mockResolvedValue({ id: 'l1', title: 'L' } as never);
      const result = await createLesson('course-1', 'user-1', {
        title: 'L',
        content: 'C',
        type: 'TEXT',
      });
      expect(result.title).toBe('L');
    });
  });

  describe('updateLesson', () => {
    it('should throw 404 when lesson not found', async () => {
      vi.mocked(prisma.lesson.findUnique).mockResolvedValue(null);
      await expect(updateLesson('course-1', 'bad-id', 'user-1', { title: 'New' })).rejects.toThrow(
        'Lesson not found'
      );
    });

    it('should throw 400 when lesson does not belong to course', async () => {
      vi.mocked(prisma.lesson.findUnique).mockResolvedValue({
        id: 'l1',
        courseId: 'other-course',
      } as never);
      await expect(updateLesson('course-1', 'l1', 'user-1', { title: 'New' })).rejects.toThrow(
        'does not belong'
      );
    });

    it('should update successfully', async () => {
      vi.mocked(prisma.lesson.findUnique).mockResolvedValue({
        id: 'l1',
        courseId: 'course-1',
      } as never);
      vi.mocked(prisma.lesson.update).mockResolvedValue({ id: 'l1', title: 'New' } as never);
      const result = await updateLesson('course-1', 'l1', 'user-1', { title: 'New' });
      expect(result.title).toBe('New');
    });
  });

  describe('deleteLesson', () => {
    it('should throw 404 when lesson not found', async () => {
      vi.mocked(prisma.lesson.findUnique).mockResolvedValue(null);
      await expect(deleteLesson('course-1', 'bad-id', 'user-1')).rejects.toThrow(
        'Lesson not found'
      );
    });

    it('should throw 400 when lesson does not belong to course', async () => {
      vi.mocked(prisma.lesson.findUnique).mockResolvedValue({
        id: 'l1',
        courseId: 'other-course',
      } as never);
      await expect(deleteLesson('course-1', 'l1', 'user-1')).rejects.toThrow('does not belong');
    });

    it('should delete successfully', async () => {
      vi.mocked(prisma.lesson.findUnique).mockResolvedValue({
        id: 'l1',
        courseId: 'course-1',
      } as never);
      vi.mocked(prisma.lesson.delete).mockResolvedValue({} as never);
      await expect(deleteLesson('course-1', 'l1', 'user-1')).resolves.toBeUndefined();
    });
  });

  describe('listCourses', () => {
    it('should return courses without pagination', async () => {
      vi.mocked(prisma.course.findMany).mockResolvedValue([
        { id: 'c1', title: 'C1', _count: { lessons: 2 }, progress: [] },
      ] as never);
      const result = await listCourses('user-1');
      expect(result).toHaveLength(1);
    });

    it('should return paginated courses', async () => {
      vi.mocked(prisma.course.findMany).mockResolvedValue([
        { id: 'c1', title: 'C1', _count: { lessons: 2 }, progress: [] },
      ] as never);
      vi.mocked(prisma.course.count).mockResolvedValue(1);
      const result = await listCourses('user-1', { page: 1, limit: 20 });
      expect(result.totalPages).toBe(1);
    });
  });

  describe('seedCoursesIfEmpty', () => {
    const origEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = origEnv;
    });

    it('should skip in production', async () => {
      process.env.NODE_ENV = 'production';
      await seedCoursesIfEmpty();
      expect(prisma.course.count).not.toHaveBeenCalled();
    });

    it('should skip when courses exist', async () => {
      process.env.NODE_ENV = 'development';
      vi.mocked(prisma.course.count).mockResolvedValue(5);
      await seedCoursesIfEmpty();
      expect(prisma.course.createMany).not.toHaveBeenCalled();
    });

    it('should create seed data when empty', async () => {
      process.env.NODE_ENV = 'development';
      vi.mocked(prisma.course.count).mockResolvedValue(0);
      vi.mocked(prisma.course.createMany).mockResolvedValue({ count: 3 });
      vi.mocked(prisma.course.findMany).mockResolvedValue([
        { id: 'c1', order: 1 },
        { id: 'c2', order: 2 },
        { id: 'c3', order: 3 },
      ] as never);
      vi.mocked(prisma.lesson.create).mockResolvedValue({} as never);
      await seedCoursesIfEmpty();
      expect(prisma.course.createMany).toHaveBeenCalled();
      expect(prisma.lesson.create).toHaveBeenCalledTimes(7);
    });
  });
});
