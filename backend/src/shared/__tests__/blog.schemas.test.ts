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

describe('blog.schemas content sanitization', () => {
  it('strips script tags from content on create', () => {
    const result = CreateBlogPostSchema.safeParse({
      title: 'Hello',
      content: '<p>hello</p><script>alert(1)</script>',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.content).toBe('<p>hello</p>');
      expect(result.data.content).not.toContain('script');
    }
  });

  it('strips event handler attributes from content on create', () => {
    const result = CreateBlogPostSchema.safeParse({
      title: 'Hello',
      content: '<img src=x onerror=alert(1)>',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.content).not.toContain('onerror');
      expect(result.data.content).toContain('<img');
    }
  });

  it('preserves benign rich text on create', () => {
    const result = CreateBlogPostSchema.safeParse({
      title: 'Hello',
      content: '<strong>bold</strong><ul><li>item</li></ul><blockquote>quote</blockquote>',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.content).toContain('<strong>bold</strong>');
      expect(result.data.content).toContain('<ul>');
      expect(result.data.content).toContain('<li>item</li>');
      expect(result.data.content).toContain('<blockquote>quote</blockquote>');
    }
  });

  it('sanitizes content on update', () => {
    const result = UpdateBlogPostSchema.safeParse({
      content: '<p>ok</p><iframe src="https://evil.example"></iframe>',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.content).toBe('<p>ok</p>');
      expect(result.data.content).not.toContain('iframe');
    }
  });
});
