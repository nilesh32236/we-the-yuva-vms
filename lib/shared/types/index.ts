import type { z } from 'zod';
import type {
  ConsentSchema,
  RegisterSchema,
  SendOtpSchema,
  VerifyOtpSchema,
} from '../schemas/auth.schemas';
import type { StaffProfileSchema, VolunteerProfileSchema } from '../schemas/profile.schemas';
import type {
  ApplicationStatusSchema,
  AttendanceSchema,
  EventSchema,
  OpportunitySchema,
} from '../schemas/opportunity.schemas';
import type { AdminUserUpdateSchema } from '../schemas/admin.schemas';

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type SendOtpInput = z.infer<typeof SendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;
export type ConsentInput = z.infer<typeof ConsentSchema>;
export type VolunteerProfileInput = z.infer<typeof VolunteerProfileSchema>;
export type StaffProfileInput = z.infer<typeof StaffProfileSchema>;
export type OpportunityInput = z.infer<typeof OpportunitySchema>;
export type EventInput = z.infer<typeof EventSchema>;
export type ApplicationStatusInput = z.infer<typeof ApplicationStatusSchema>;
export type AttendanceInput = z.infer<typeof AttendanceSchema>;
export type AdminUserUpdateInput = z.infer<typeof AdminUserUpdateSchema>;

export type UserRole = 'VOLUNTEER' | 'COORDINATOR' | 'ADMIN' | 'OBSERVER';
export type UserStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
