import type { z } from 'zod';
import type { AdminUserUpdateSchema } from '../schemas/admin.schemas';
import type {
  ConsentSchema,
  RegisterSchema,
  SendOtpSchema,
  VerifyOtpSchema,
} from '../schemas/auth.schemas';
import type { CreateBlogPostSchema, UpdateBlogPostSchema } from '../schemas/blog.schemas';
import type {
  ApplicationStatusSchema,
  AttendanceSchema,
  EventSchema,
  OpportunitySchema,
} from '../schemas/opportunity.schemas';
import type {
  OrganizationDocumentSchema,
  RegisterOrganizationSchema,
} from '../schemas/organization.schemas';
import type {
  StaffProfileSchema,
  UpdateMeSchema,
  VolunteerProfileSchema,
} from '../schemas/profile.schemas';

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type SendOtpInput = z.infer<typeof SendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;
export type ConsentInput = z.infer<typeof ConsentSchema>;
export type VolunteerProfileInput = z.infer<typeof VolunteerProfileSchema>;
export type StaffProfileInput = z.infer<typeof StaffProfileSchema>;
export type UpdateMeInput = z.infer<typeof UpdateMeSchema>;
export type OpportunityInput = z.infer<typeof OpportunitySchema>;
export type EventInput = z.infer<typeof EventSchema>;
export type ApplicationStatusInput = z.infer<typeof ApplicationStatusSchema>;
export type AttendanceInput = z.infer<typeof AttendanceSchema>;
export type AdminUserUpdateInput = z.infer<typeof AdminUserUpdateSchema>;
export type OrganizationDocumentInput = z.infer<typeof OrganizationDocumentSchema>;
export type RegisterOrganizationInput = z.infer<typeof RegisterOrganizationSchema>;
export type CreateBlogPostInput = z.infer<typeof CreateBlogPostSchema>;
export type UpdateBlogPostInput = z.infer<typeof UpdateBlogPostSchema>;

export type UserRole = 'VOLUNTEER' | 'COORDINATOR' | 'ORGANIZATION_ADMIN' | 'PLATFORM_MANAGER' | 'ADMIN' | 'OBSERVER';
export type UserStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
