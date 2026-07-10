import { z } from 'zod';

export const ORGANIZATION_STATUSES = ['PENDING', 'ACTIVE', 'SUSPENDED'] as const;

export const RegisterOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(200, 'Organization name too long'),
  description: z.string().max(2000, 'Description too long').optional(),
  address: z.string().max(500, 'Address too long').optional(),
  phone: z
    .string()
    .regex(/^[+]?[\d\s()-]{7,20}$/, 'Invalid phone number format')
    .optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
});

export const OrganizationDocumentSchema = z.object({
  fileName: z.string().min(1, 'File name is required').max(255, 'Filename too long'),
  fileUrl: z.string().url('File URL must be a valid URL'),
  type: z.enum(['REGISTRATION_CERTIFICATE', 'GOVT_ID', 'OTHER'], {
    errorMap: () => ({
      message: 'Document type must be REGISTRATION_CERTIFICATE, GOVT_ID, or OTHER',
    }),
  }),
});
