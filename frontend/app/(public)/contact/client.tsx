'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Send } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

const ContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Please select a subject'),
  message: z.string().min(1, 'Message is required'),
});
type ContactInput = z.infer<typeof ContactSchema>;

const SUBJECTS = ['General Inquiry', 'Partnership', 'Volunteer Support', 'Media', 'Other'] as const;

export function ContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(ContactSchema),
  });

  async function onSubmit(data: ContactInput) {
    try {
      await api.post('/contact', data);
      toast({
        title: 'Message sent!',
        description: "We'll get back to you within 48 hours.",
      });
      reset();
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Contact form error:', err);
      }
      toast({
        title: 'Something went wrong',
        description: 'Could not send your message. Please try again.',
        variant: 'destructive',
      });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-brand-text">
          Name
        </label>
        <input
          id="name"
          type="text"
          {...register('name')}
          disabled={isSubmitting}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
          className={`w-full rounded-xl border p-3 bg-background text-base text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary ${errors.name ? 'border-brand-error' : 'border-brand-border'}`}
          placeholder="Your name"
        />
        {errors.name && (
          <p id="name-error" className="mt-1 text-xs text-brand-error" role="alert">
            {errors.name.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-brand-text">
          Email
        </label>
        <input
          id="email"
          type="email"
          {...register('email')}
          disabled={isSubmitting}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
          className={`w-full rounded-xl border p-3 bg-background text-base text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary ${errors.email ? 'border-brand-error' : 'border-brand-border'}`}
          placeholder="you@example.com"
        />
        {errors.email && (
          <p id="email-error" className="mt-1 text-xs text-brand-error" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="subject" className="mb-1.5 block text-sm font-medium text-brand-text">
          Subject
        </label>
        <select
          id="subject"
          {...register('subject')}
          disabled={isSubmitting}
          aria-invalid={!!errors.subject}
          aria-describedby={errors.subject ? 'subject-error' : undefined}
          className={`w-full rounded-xl border p-3 bg-background text-base text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary ${errors.subject ? 'border-brand-error' : 'border-brand-border'}`}
        >
          <option value="" disabled>
            Select a subject
          </option>
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {errors.subject && (
          <p id="subject-error" className="mt-1 text-xs text-brand-error" role="alert">
            {errors.subject.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-brand-text">
          Message
        </label>
        <textarea
          id="message"
          rows={5}
          {...register('message')}
          disabled={isSubmitting}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? 'message-error' : undefined}
          className={`w-full rounded-xl border p-3 bg-background text-base text-brand-text placeholder:text-brand-muted resize-y focus:outline-none focus:ring-2 focus:ring-brand-primary ${errors.message ? 'border-brand-error' : 'border-brand-border'}`}
          placeholder="Tell us what's on your mind..."
        />
        {errors.message && (
          <p id="message-error" className="mt-1 text-xs text-brand-error" role="alert">
            {errors.message.message}
          </p>
        )}
      </div>

      <Button type="submit" loading={isSubmitting} className="px-6">
        {!isSubmitting && <Send className="h-4 w-4" aria-hidden="true" />}
        {isSubmitting ? 'Sending...' : 'Send message'}
      </Button>
    </form>
  );
}
