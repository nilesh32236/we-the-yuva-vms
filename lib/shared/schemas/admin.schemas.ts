import { z } from 'zod';

export const AdminUserUpdateSchema = z
  .object({
    status: z.enum(['PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
    role: z.enum(['VOLUNTEER', 'COORDINATOR', 'ADMIN', 'OBSERVER']).optional(),
  })
  .refine((d) => d.status !== undefined || d.role !== undefined, {
    message: 'At least one of status or role must be provided',
  });
