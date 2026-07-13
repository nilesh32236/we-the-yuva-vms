import { z } from 'zod';

export const RegisterOrganizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(2000).optional(),
  address: z.string().max(500).optional(),
  phone: z.string().min(10).max(15).regex(/^\+?\d{1,3}[\s\-]?\d{6,14}$/, 'Invalid phone number format').optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
});

export type RegisterOrganizationInput = z.infer<typeof RegisterOrganizationSchema>;

export const OrganizationDocumentSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileUrl: z.string().min(1, 'File URL is required'),
  type: z.enum(['REGISTRATION_CERTIFICATE', 'GOVT_ID', 'OTHER'], {
    errorMap: () => ({
      message: 'Document type must be REGISTRATION_CERTIFICATE, GOVT_ID, or OTHER',
    }),
  }),
});

export type OrganizationDocumentInput = z.infer<typeof OrganizationDocumentSchema>;
