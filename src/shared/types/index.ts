import type { z } from 'zod';
import type { AdminCreateUserSchema, AdminUserUpdateSchema } from '../schemas/admin.schemas';
import type {
  AlertSubscriptionSchema,
  AlertSubscriptionUpdateSchema,
} from '../schemas/alerts.schemas';
import type {
  ConsentSchema,
  RegisterSchema,
  SendOtpSchema,
  VerifyOtpSchema,
} from '../schemas/auth.schemas';
import type { FeedbackSchema, UpdateFeedbackSchema } from '../schemas/feedback.schemas';
import type {
  NotificationPreferenceSchema,
  PushSubscriptionSchema,
  PushUnsubscribeSchema,
} from '../schemas/notifications.schemas';
import type {
  ApplicationStatusSchema,
  ApplySchema,
  AttendanceSchema,
  CheckInSchema,
  CheckOutSchema,
  EventSchema,
  OpportunitySchema,
} from '../schemas/opportunity.schemas';
import type { StaffProfileSchema, UpdateMeSchema, VolunteerProfileSchema } from '../schemas/profile.schemas';
import type {
  CompleteLessonSchema,
  CreateCourseSchema,
  CreateLessonSchema,
  UpdateCourseSchema,
  UpdateLessonSchema,
} from '../schemas/training.schemas';
import type {
  CreateStorySchema,
  ModerateStorySchema,
  UpdateStorySchema,
} from '../schemas/stories.schemas';

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
export type AdminCreateUserInput = z.infer<typeof AdminCreateUserSchema>;
export type AdminUserUpdateInput = z.infer<typeof AdminUserUpdateSchema>;
export type CreateStoryInput = z.infer<typeof CreateStorySchema>;
export type UpdateStoryInput = z.infer<typeof UpdateStorySchema>;
export type ModerateStoryInput = z.infer<typeof ModerateStorySchema>;
export type FeedbackInput = z.infer<typeof FeedbackSchema>;
export type UpdateFeedbackInput = z.infer<typeof UpdateFeedbackSchema>;
export type PushSubscriptionInput = z.infer<typeof PushSubscriptionSchema>;
export type PushUnsubscribeInput = z.infer<typeof PushUnsubscribeSchema>;
export type NotificationPreferenceInput = z.infer<typeof NotificationPreferenceSchema>;
export type AlertSubscriptionInput = z.infer<typeof AlertSubscriptionSchema>;
export type AlertSubscriptionUpdateInput = z.infer<typeof AlertSubscriptionUpdateSchema>;
export type CheckInInput = z.infer<typeof CheckInSchema>;
export type CheckOutInput = z.infer<typeof CheckOutSchema>;
export type ApplyInput = z.infer<typeof ApplySchema>;
export type CompleteLessonInput = z.infer<typeof CompleteLessonSchema>;
export type CreateCourseInput = z.infer<typeof CreateCourseSchema>;
export type UpdateCourseInput = z.infer<typeof UpdateCourseSchema>;
export type CreateLessonInput = z.infer<typeof CreateLessonSchema>;
export type UpdateLessonInput = z.infer<typeof UpdateLessonSchema>;

export type UserRole = 'VOLUNTEER' | 'COORDINATOR' | 'ADMIN' | 'OBSERVER';
export type UserStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
