import { describe, expect, it } from 'vitest';

import {
  CreateStorySchema,
  ModerateStorySchema,
  UpdateStorySchema,
} from '../schemas/stories.schemas';

describe('stories.schemas', () => {
  describe('CreateStorySchema', () => {
    it('should accept valid story', () => {
      const result = CreateStorySchema.safeParse({
        title: 'My Volunteer Journey',
        content: 'I volunteered at a local school and it was amazing!',
      });
      expect(result.success).toBe(true);
    });

    it('should accept story with mediaUrl', () => {
      const result = CreateStorySchema.safeParse({
        title: 'My Journey',
        content: 'Amazing experience',
        mediaUrl: 'https://example.com/photo.jpg',
      });
      expect(result.success).toBe(true);
    });

    it('should accept story with relative mediaUrl', () => {
      const result = CreateStorySchema.safeParse({
        title: 'My Journey',
        content: 'Amazing experience',
        mediaUrl: '/uploads/photo.jpg',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty title', () => {
      const result = CreateStorySchema.safeParse({ title: '', content: 'content' });
      expect(result.success).toBe(false);
    });

    it('should reject empty content', () => {
      const result = CreateStorySchema.safeParse({ title: 'Title', content: '' });
      expect(result.success).toBe(false);
    });

    it('should reject title over 200 chars', () => {
      const result = CreateStorySchema.safeParse({
        title: 'x'.repeat(201),
        content: 'content',
      });
      expect(result.success).toBe(false);
    });

    it('should reject content over 5000 chars', () => {
      const result = CreateStorySchema.safeParse({
        title: 'Title',
        content: 'x'.repeat(5001),
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid mediaUrl', () => {
      const result = CreateStorySchema.safeParse({
        title: 'Title',
        content: 'content',
        mediaUrl: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateStorySchema', () => {
    it('should accept partial update', () => {
      const result = UpdateStorySchema.safeParse({ title: 'New Title' });
      expect(result.success).toBe(true);
    });

    it('should reject empty title when provided', () => {
      const result = UpdateStorySchema.safeParse({ title: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('ModerateStorySchema', () => {
    it('should accept true', () => {
      const result = ModerateStorySchema.safeParse({ published: true });
      expect(result.success).toBe(true);
    });

    it('should accept false', () => {
      const result = ModerateStorySchema.safeParse({ published: false });
      expect(result.success).toBe(true);
    });

    it('should reject missing published', () => {
      const result = ModerateStorySchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject non-boolean', () => {
      const result = ModerateStorySchema.safeParse({ published: 'yes' });
      expect(result.success).toBe(false);
    });
  });
});
