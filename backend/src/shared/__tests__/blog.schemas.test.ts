import { describe, expect, it } from 'vitest';
import { CreateBlogPostSchema, UpdateBlogPostSchema } from '../schemas/blog.schemas';

describe('CreateBlogPostSchema', () => {
  it('should accept valid input', () => {
    const result = CreateBlogPostSchema.safeParse({
      title: 'My Post',
      content: 'Hello world',
      tags: ['tech'],
    });
    expect(result.success).toBe(true);
  });
  it('should reject empty title', () => {
    const result = CreateBlogPostSchema.safeParse({ title: '', content: 'x' });
    expect(result.success).toBe(false);
  });
  it('should default tags to []', () => {
    const result = CreateBlogPostSchema.safeParse({ title: 'T', content: 'C' });
    expect(result.success && result.data.tags).toEqual([]);
  });
});

describe('UpdateBlogPostSchema', () => {
  it('should accept partial update', () => {
    const result = UpdateBlogPostSchema.safeParse({ title: 'New Title' });
    expect(result.success).toBe(true);
  });
});
