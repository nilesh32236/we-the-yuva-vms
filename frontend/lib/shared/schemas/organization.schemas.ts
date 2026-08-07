import { z } from 'zod';

export const RegisterOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(120, 'Organization name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  address: z.string().max(300, 'Address too long').optional(),
  phone: z.string().max(20, 'Phone number too long').optional(),
  logo: z
    .union([z.string().url('Invalid logo URL'), z.string().startsWith('/'), z.literal('')])
    .optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
});

export const OrganizationDocumentSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileUrl: z.string().min(1, 'File URL is required'),
  type: z.enum(['REGISTRATION_CERTIFICATE', 'GOVT_ID', 'OTHER'], {
    errorMap: () => ({
      message: 'Document type must be REGISTRATION_CERTIFICATE, GOVT_ID, or OTHER',
    }),
  }),
});
