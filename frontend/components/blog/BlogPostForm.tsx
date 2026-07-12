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
           className={`w-full px-3 py-2.5 rounded-xl border text-base bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary ${errors.title ? 'border-brand-error' : 'border-brand-border'}`}
          {...register('title')}
        />
        {errors.title && <p className="text-xs text-brand-error">{errors.title.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="excerpt" className="text-sm font-medium text-brand-text">
          Excerpt
        </label>
        <textarea
          id="excerpt"
          rows={2}
          placeholder="Brief summary for card previews"
          className="w-full px-3 py-2.5 rounded-xl border border-brand-border text-base bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
          {...register('excerpt')}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="content" className="text-sm font-medium text-brand-text">
          Content *
        </label>
        <RichTextEditor
          content={contentValue}
          onChange={(html) => {
            setValue('content', html, { shouldValidate: true });
            trigger('content');
          }}
        />
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
          className="w-full px-3 py-2.5 rounded-xl border border-brand-border text-base bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary"
          {...register('featuredImage')}
        />
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
            className="w-full px-3 py-2.5 rounded-xl border border-brand-border text-base bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="category" className="text-sm font-medium text-brand-text">
            Category
          </label>
          <input
            id="category"
            type="text"
            placeholder="e.g. Stories, Updates"
            className="w-full px-3 py-2.5 rounded-xl border border-brand-border text-base bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary"
            {...register('category')}
          />
        </div>
      </div>

      <Button type="submit" variant="primary" loading={isSubmitting}>
        {submitLabel}
      </Button>
    </form>
  );
}
