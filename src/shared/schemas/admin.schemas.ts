import { z } from 'zod';

export const AdminCreateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['VOLUNTEER', 'COORDINATOR', 'ORGANIZATION_ADMIN', 'ADMIN', 'OBSERVER']),
  locationName: z.string().min(1).max(100).optional(),
});

export const AdminUserUpdateSchema = z
  .object({
    status: z.enum(['PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
    role: z.enum(['VOLUNTEER', 'COORDINATOR', 'ORGANIZATION_ADMIN', 'ADMIN', 'OBSERVER']).optional(),
  })
  .refine((d) => d.status !== undefined || d.role !== undefined, {
    message: 'At least one of status or role must be provided',
  });
