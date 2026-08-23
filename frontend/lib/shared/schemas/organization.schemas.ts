import { z } from 'zod';

// Full URLs only (no relative paths). Also reject dangerous schemes like
// `javascript:`/`data:`, which zod's .url() accepts, to avoid XSS when the
// value is rendered into an anchor href.
const httpUrl = (message: string) =>
  z
    .string()
    .url(message)
    .refine((v) => /^https?:\/\//i.test(v), message);

export const RegisterOrganizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  description: z.string().max(1000, 'Description too long').optional(),
  address: z.string().max(200, 'Address too long').optional(),
  phone: z.string().max(20, 'Phone number too long').optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
});

export const OrganizationDocumentSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileUrl: httpUrl('File URL must be a valid URL'),
  type: z.enum(['REGISTRATION_CERTIFICATE', 'GOVT_ID', 'OTHER'], {
    errorMap: () => ({
      message: 'Document type must be REGISTRATION_CERTIFICATE, GOVT_ID, or OTHER',
    }),
  }),
});
