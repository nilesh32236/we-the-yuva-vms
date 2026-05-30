import type {
  CreateCourseInput,
  CreateLessonInput,
  UpdateCourseInput,
  UpdateLessonInput,
} from '@/shared';
import { logAudit } from '../../lib/audit';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/error.middleware';

export async function createCourse(userId: string, data: CreateCourseInput) {
  const course = await prisma.course.create({ data });
  await logAudit({ userId, action: 'COURSE_CREATE', targetId: course.id, targetType: 'Course' });
  return course;
}

export async function updateCourse(id: string, userId: string, data: UpdateCourseInput) {
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) throw new AppError('Course not found', 404);
  const updated = await prisma.course.update({ where: { id }, data });
  await logAudit({ userId, action: 'COURSE_UPDATE', targetId: id, targetType: 'Course' });
  return updated;
}

export async function deleteCourse(id: string, userId: string) {
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) throw new AppError('Course not found', 404);
  await prisma.course.delete({ where: { id } });
  await logAudit({ userId, action: 'COURSE_DELETE', targetId: id, targetType: 'Course' });
}

export async function createLesson(courseId: string, userId: string, data: CreateLessonInput) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new AppError('Course not found', 404);
  const lesson = await prisma.lesson.create({ data: { ...data, courseId } });
  await logAudit({
    userId,
    action: 'LESSON_CREATE',
    targetId: lesson.id,
    targetType: 'Lesson',
    metadata: { courseId },
  });
  return lesson;
}

export async function updateLesson(
  courseId: string,
  id: string,
  userId: string,
  data: UpdateLessonInput
) {
  const lesson = await prisma.lesson.findUnique({ where: { id } });
  if (!lesson) throw new AppError('Lesson not found', 404);
  if (lesson.courseId !== courseId)
    throw new AppError('Lesson does not belong to this course', 400);
  const updated = await prisma.lesson.update({ where: { id }, data });
  await logAudit({
    userId,
    action: 'LESSON_UPDATE',
    targetId: id,
    targetType: 'Lesson',
    metadata: { courseId },
  });
  return updated;
}

export async function deleteLesson(courseId: string, id: string, userId: string) {
  const lesson = await prisma.lesson.findUnique({ where: { id } });
  if (!lesson) throw new AppError('Lesson not found', 404);
  if (lesson.courseId !== courseId)
    throw new AppError('Lesson does not belong to this course', 400);
  await prisma.lesson.delete({ where: { id } });
  await logAudit({
    userId,
    action: 'LESSON_DELETE',
    targetId: id,
    targetType: 'Lesson',
    metadata: { courseId },
  });
}

export async function listCourses(userId: string, pagination?: { page: number; limit: number }) {
  if (!pagination) {
    const courses = await prisma.course.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: { select: { lessons: true } },
        progress: { where: { userId }, select: { completed: true, completedAt: true } },
      },
    });
    return courses.map((c) => ({
      ...c,
      lessonCount: c._count.lessons,
      progress: c.progress[0] ?? null,
    }));
  }
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.course.findMany({
      skip,
      take: limit,
      orderBy: { order: 'asc' },
      include: {
        _count: { select: { lessons: true } },
        progress: { where: { userId }, select: { completed: true, completedAt: true } },
      },
    }),
    prisma.course.count(),
  ]);
  return {
    data: data.map((c) => ({
      ...c,
      lessonCount: c._count.lessons,
      progress: c.progress[0] ?? null,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getCourse(courseId: string, userId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      lessons: { orderBy: { order: 'asc' } },
      progress: { where: { userId } },
    },
  });

  if (!course) throw new AppError('Course not found', 404);

  const completedLessonIds = await prisma.lessonCompletion.findMany({
    where: { userId, lesson: { courseId } },
    select: { lessonId: true },
  });

  const completedSet = new Set(completedLessonIds.map((l) => l.lessonId));

  return {
    ...course,
    lessons: course.lessons.map((l) => ({ ...l, completed: completedSet.has(l.id) })),
    progress: course.progress[0] ?? null,
  };
}

export async function completeLesson(lessonId: string, userId: string) {
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) throw new AppError('Lesson not found', 404);

  // Mark lesson complete (idempotent)
  await prisma.lessonCompletion.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: { userId, lessonId },
    update: {},
  });

  // Check if all lessons in course are done
  const [totalLessons, completedLessons] = await Promise.all([
    prisma.lesson.count({ where: { courseId: lesson.courseId } }),
    prisma.lessonCompletion.count({
      where: { userId, lesson: { courseId: lesson.courseId } },
    }),
  ]);

  if (completedLessons >= totalLessons) {
    await prisma.courseProgress.upsert({
      where: { userId_courseId: { userId, courseId: lesson.courseId } },
      create: { userId, courseId: lesson.courseId, completed: true, completedAt: new Date() },
      update: { completed: true, completedAt: new Date() },
    });
  } else {
    await prisma.courseProgress.upsert({
      where: { userId_courseId: { userId, courseId: lesson.courseId } },
      create: { userId, courseId: lesson.courseId, completed: false },
      update: {},
    });
  }

  return { lessonId, courseCompleted: completedLessons >= totalLessons };
}

// Seed default courses if none exist
export async function seedCoursesIfEmpty() {
  if (process.env.NODE_ENV === 'production') return;
  const count = await prisma.course.count();
  if (count > 0) return;

  await prisma.course.createMany({
    data: [
      {
        title: 'Volunteer Orientation',
        description:
          'Welcome to WeTheYuva! Learn about our mission, values, and how to get started as a volunteer.',
        category: 'ORIENTATION',
        isRequired: true,
        order: 1,
      },
      {
        title: 'Safety & Code of Conduct',
        description: 'Essential safety guidelines and our code of conduct for all volunteers.',
        category: 'SAFETY',
        isRequired: true,
        order: 2,
      },
      {
        title: 'Community Engagement',
        description: 'Best practices for engaging with communities respectfully and effectively.',
        category: 'SKILLS',
        isRequired: false,
        order: 3,
      },
    ],
  });

  const courses = await prisma.course.findMany({ orderBy: { order: 'asc' } });

  const lessons = [
    // Course 1
    {
      courseId: courses[0].id,
      title: 'Welcome to WeTheYuva',
      content:
        'WeTheYuva is a volunteer management platform connecting passionate individuals with meaningful opportunities. Our mission is to empower communities through organized, impactful volunteering.\n\nIn this orientation, you will learn:\n- How to find and apply for opportunities\n- How to check in and out of events\n- How to track your volunteer hours and impact',
      type: 'TEXT',
      order: 1,
    },
    {
      courseId: courses[0].id,
      title: 'Your Volunteer Journey',
      content:
        'Your journey as a WeTheYuva volunteer follows these steps:\n\n1. **Discover** — Browse opportunities that match your skills and interests\n2. **Apply** — Submit your application with a single click\n3. **Get Accepted** — Coordinator reviews and accepts your application\n4. **Attend Events** — Check in when you arrive, check out when you leave\n5. **Track Impact** — See your total hours and events on your dashboard',
      type: 'TEXT',
      order: 2,
    },
    {
      courseId: courses[0].id,
      title: 'Using the Platform',
      content:
        'Key features you should know:\n\n**Dashboard** — Your personal overview with stats and quick actions\n**Opportunities** — Browse and apply for volunteer opportunities\n**My Events** — See your upcoming events and check in/out\n**Profile** — Update your skills, interests, and bio\n\nTip: Keep your profile updated with your latest skills — coordinators use this to match you with the right opportunities!',
      type: 'TEXT',
      order: 3,
    },
    // Course 2
    {
      courseId: courses[1].id,
      title: 'Safety Guidelines',
      content:
        'Your safety is our top priority. Please follow these guidelines at all events:\n\n- Always check in when you arrive at an event\n- Inform the coordinator if you need to leave early\n- Do not share personal contact details with beneficiaries\n- Report any safety concerns to your coordinator immediately\n- Follow all venue-specific safety rules',
      type: 'TEXT',
      order: 1,
    },
    {
      courseId: courses[1].id,
      title: 'Code of Conduct',
      content:
        'As a WeTheYuva volunteer, you agree to:\n\n✓ Treat all people with dignity and respect\n✓ Maintain confidentiality of beneficiary information\n✓ Represent WeTheYuva professionally\n✓ Communicate openly with your coordinator\n✓ Complete commitments you have made\n\n✗ Do not discriminate based on religion, caste, gender, or background\n✗ Do not take photos of beneficiaries without explicit consent\n✗ Do not make promises on behalf of WeTheYuva',
      type: 'TEXT',
      order: 2,
    },
    // Course 3
    {
      courseId: courses[2].id,
      title: 'Effective Communication',
      content:
        'Good communication is the foundation of impactful volunteering:\n\n**Listen actively** — Give your full attention, ask clarifying questions\n**Be culturally sensitive** — Respect local customs and traditions\n**Use simple language** — Avoid jargon, speak clearly\n**Be patient** — Change takes time, celebrate small wins\n\nRemember: You are a guest in the community. Approach every interaction with humility and curiosity.',
      type: 'TEXT',
      order: 1,
    },
    {
      courseId: courses[2].id,
      title: 'Building Trust',
      content:
        'Trust is earned through consistent, respectful action:\n\n1. **Show up** — Reliability is the most important quality\n2. **Follow through** — Do what you say you will do\n3. **Be honest** — If you cannot make it, inform your coordinator early\n4. **Respect boundaries** — Understand what help is wanted vs. imposed\n5. **Celebrate community strengths** — Focus on assets, not deficits',
      type: 'TEXT',
      order: 2,
    },
  ] as const;

  for (const lesson of lessons) {
    await prisma.lesson.create({ data: lesson });
  }
}
