import { z } from 'zod';

export const SUBJECTS = ['General Inquiry', 'Partnership', 'Volunteer Support', 'Media', 'Other'] as const;

export const ContactFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Please enter a valid email'),
  subject: z.enum(SUBJECTS),
  message: z.string().min(1, 'Message is required').max(2000, 'Message too long'),
});