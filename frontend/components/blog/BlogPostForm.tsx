'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { CreateBlogPostInput } from '@/lib/shared';
import { CreateBlogPostSchema } from '@/lib/shared';
import { Button } from '../ui/Button';
import { RichTextEditor } from './RichTextEditor';

interface BlogPostFormProps {
  defaultValues?: Partial<CreateBlogPostInput>;
  onSubmit: (data: CreateBlogPostInput) => Promise<void>;
  submitLabel?: string;
}

export function BlogPostForm({ defaultValues, onSubmit, submitLabel = 'Save' }: BlogPostFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<CreateBlogPostInput>({
    resolver: zodResolver(CreateBlogPostSchema),
    defaultValues: { tags: [], content: '', ...defaultValues },
  });

  const tagsString = (watch('tags') ?? []).join(', ');
  const contentValue = watch('content');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="title" className="text-sm font-medium text-brand-text">
          Title *
        </label>
        <input
          id="title"
          type="text"
          placeholder="Enter post title"
          disabled={isSubmitting}
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? 'title-error' : undefined}
          className={`w-full px-3 py-2.5 rounded-xl border text-base bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary ${errors.title ? 'border-brand-error' : 'border-brand-border'}`}
          {...register('title')}
        />
        {errors.title && (
          <p id="title-error" className="text-xs text-brand-error">
            {errors.title.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="excerpt" className="text-sm font-medium text-brand-text">
          Excerpt
        </label>
        <textarea
          id="excerpt"
          rows={2}
          placeholder="Brief summary for card previews"
          disabled={isSubmitting}
          aria-invalid={!!errors.excerpt}
          aria-describedby={errors.excerpt ? 'excerpt-error' : undefined}
          className={`w-full px-3 py-2.5 rounded-xl border text-base bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none ${errors.excerpt ? 'border-brand-error' : 'border-brand-border'}`}
          {...register('excerpt')}
        />
        {errors.excerpt && (
          <p id="excerpt-error" className="text-xs text-brand-error">
            {errors.excerpt.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="content" className="text-sm font-medium text-brand-text">
          Content *
        </label>
        <div
          className={`rounded-xl border ${errors.content ? 'border-brand-error' : 'border-brand-border'} ${isSubmitting ? 'pointer-events-none opacity-70' : ''}`}
        >
          <RichTextEditor
            content={contentValue}
            onChange={(html) => {
              setValue('content', html, { shouldValidate: true });
              trigger('content');
            }}
          />
        </div>
        {errors.content && (
          <p className="text-xs text-brand-error mt-1">{errors.content.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="featuredImage" className="text-sm font-medium text-brand-text">
          Featured Image URL
        </label>
        <input
          id="featuredImage"
          type="text"
          placeholder="https://example.com/image.jpg"
          disabled={isSubmitting}
          aria-invalid={!!errors.featuredImage}
          aria-describedby={errors.featuredImage ? 'featuredImage-error' : undefined}
          className={`w-full px-3 py-2.5 rounded-xl border text-base bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary ${errors.featuredImage ? 'border-brand-error' : 'border-brand-border'}`}
          {...register('featuredImage')}
        />
        {errors.featuredImage && (
          <p id="featuredImage-error" className="text-xs text-brand-error">
            {errors.featuredImage.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="tags" className="text-sm font-medium text-brand-text">
            Tags (comma-separated)
          </label>
          <input
            id="tags"
            type="text"
            placeholder="e.g. tech, community, leadership"
            disabled={isSubmitting}
            value={tagsString}
            onChange={(e) =>
              setValue(
                'tags',
                e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
              )
            }
            aria-invalid={!!errors.tags}
            aria-describedby={errors.tags ? 'tags-error' : undefined}
            className={`w-full px-3 py-2.5 rounded-xl border text-base bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary ${errors.tags ? 'border-brand-error' : 'border-brand-border'}`}
          />
          {errors.tags && (
            <p id="tags-error" className="text-xs text-brand-error">
              {errors.tags.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="category" className="text-sm font-medium text-brand-text">
            Category
          </label>
          <input
            id="category"
            type="text"
            placeholder="e.g. Stories, Updates"
            disabled={isSubmitting}
            aria-invalid={!!errors.category}
            aria-describedby={errors.category ? 'category-error' : undefined}
            className={`w-full px-3 py-2.5 rounded-xl border text-base bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary ${errors.category ? 'border-brand-error' : 'border-brand-border'}`}
            {...register('category')}
          />
          {errors.category && (
            <p id="category-error" className="text-xs text-brand-error">
              {errors.category.message}
            </p>
          )}
        </div>
      </div>

      <Button type="submit" variant="primary" loading={isSubmitting}>
        {submitLabel}
      </Button>
    </form>
  );
}
