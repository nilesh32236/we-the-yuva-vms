import { describe, expect, it } from 'vitest';

import {
  CompleteLessonSchema,
  CreateCourseSchema,
  CreateLessonSchema,
  UpdateCourseSchema,
  UpdateLessonSchema,
} from '../schemas/training.schemas';

describe('training.schemas', () => {
  describe('CreateCourseSchema', () => {
    it('should accept valid course', () => {
      const result = CreateCourseSchema.safeParse({
        title: 'Safety Training',
        description: 'Learn safety protocols',
        category: 'SAFETY',
      });
      expect(result.success).toBe(true);
    });

    it('should accept course with optional fields', () => {
      const result = CreateCourseSchema.safeParse({
        title: 'Safety Training',
        description: 'Learn safety protocols',
        category: 'GENERAL',
        isRequired: true,
        order: 1,
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty title', () => {
      const result = CreateCourseSchema.safeParse({
        title: '',
        description: 'desc',
        category: 'GENERAL',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty description', () => {
      const result = CreateCourseSchema.safeParse({
        title: 'Title',
        description: '',
        category: 'GENERAL',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid category', () => {
      const result = CreateCourseSchema.safeParse({
        title: 'Title',
        description: 'desc',
        category: 'INVALID',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateCourseSchema', () => {
    it('should accept partial update', () => {
      const result = UpdateCourseSchema.safeParse({ title: 'New Title' });
      expect(result.success).toBe(true);
    });

    it('should accept all fields', () => {
      const result = UpdateCourseSchema.safeParse({
        title: 'New',
        description: 'New desc',
        category: 'LEADERSHIP',
        isRequired: false,
        order: 2,
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty title when provided', () => {
      const result = UpdateCourseSchema.safeParse({ title: '' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid category', () => {
      const result = UpdateCourseSchema.safeParse({ category: 'BAD' });
      expect(result.success).toBe(false);
    });
  });

  describe('CreateLessonSchema', () => {
    it('should accept valid lesson', () => {
      const result = CreateLessonSchema.safeParse({
        title: 'Lesson 1',
        content: 'Lesson content',
      });
      expect(result.success).toBe(true);
    });

    it('should accept lesson with all fields', () => {
      const result = CreateLessonSchema.safeParse({
        title: 'Lesson 1',
        content: 'Content',
        type: 'VIDEO',
        mediaUrl: 'https://example.com/video.mp4',
        order: 1,
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty title', () => {
      const result = CreateLessonSchema.safeParse({ title: '', content: 'content' });
      expect(result.success).toBe(false);
    });

    it('should reject empty content', () => {
      const result = CreateLessonSchema.safeParse({ title: 'Title', content: '' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid type', () => {
      const result = CreateLessonSchema.safeParse({
        title: 'Title',
        content: 'content',
        type: 'INVALID',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid mediaUrl', () => {
      const result = CreateLessonSchema.safeParse({
        title: 'Title',
        content: 'content',
        mediaUrl: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateLessonSchema', () => {
    it('should accept partial update', () => {
      const result = UpdateLessonSchema.safeParse({ title: 'New Title' });
      expect(result.success).toBe(true);
    });

    it('should reject empty title when provided', () => {
      const result = UpdateLessonSchema.safeParse({ title: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('CompleteLessonSchema', () => {
    it('should accept empty input', () => {
      const result = CompleteLessonSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept optional timeSpent', () => {
      const result = CompleteLessonSchema.safeParse({ timeSpent: 60 });
      expect(result.success).toBe(true);
    });

    it('should accept quizScore', () => {
      const result = CompleteLessonSchema.safeParse({ quizScore: 85 });
      expect(result.success).toBe(true);
    });

    it('should reject negative timeSpent', () => {
      const result = CompleteLessonSchema.safeParse({ timeSpent: -1 });
      expect(result.success).toBe(false);
    });

    it('should reject quizScore over 100', () => {
      const result = CompleteLessonSchema.safeParse({ quizScore: 101 });
      expect(result.success).toBe(false);
    });

    it('should reject quizScore below 0', () => {
      const result = CompleteLessonSchema.safeParse({ quizScore: -1 });
      expect(result.success).toBe(false);
    });
  });
});
