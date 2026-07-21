export const Permissions = {
  SYSTEM_CONFIG: 'system:config',

  USER_MANAGE: 'user:manage',
  USER_PROFILE_MANAGE: 'user:profile:manage',
  USER_PROFILE_VIEW: 'user:profile:view',
  USER_EVENTS_VIEW: 'user:events:view',
  USER_VOLUNTEERS_MANAGE: 'user:volunteers:manage',

  OPPORTUNITY_CREATE: 'opportunity:create',
  OPPORTUNITY_EDIT: 'opportunity:edit',
  OPPORTUNITY_VIEW: 'opportunity:view',
  OPPORTUNITY_APPLY: 'opportunity:apply',
  OPPORTUNITY_MANAGE: 'opportunity:manage',

  EVENT_CREATE: 'event:create',
  EVENT_EDIT: 'event:edit',
  EVENT_MANAGE: 'event:manage',
  EVENT_CHECKIN: 'event:checkin',

  STATS_VIEW_OWN: 'stats:view:own',
  STATS_VIEW_OBSERVER: 'stats:view:observer',

  STORY_CREATE: 'story:create',
  STORY_EDIT: 'story:edit',
  STORY_MODERATE: 'story:moderate',
  STORY_VIEW_ALL: 'story:view:all',

  TRAINING_CREATE: 'training:create',
  TRAINING_EDIT: 'training:edit',
  TRAINING_COMPLETE: 'training:complete',

  ALERT_MANAGE: 'alert:manage',

  FEEDBACK_SUBMIT: 'feedback:submit',
  FEEDBACK_MANAGE: 'feedback:manage',

  ORG_CREATE: 'org:create',
  ORG_MANAGE: 'org:manage',
  ORG_VERIFY: 'org:verify',

  COORDINATOR_MANAGE: 'coordinator:manage',

  LEVEL_VIEW: 'level:view',
  LEVEL_REQUEST: 'level:request',
  LEVEL_REVIEW: 'level:review',

  CERTIFICATE_VIEW: 'certificate:view',
  CERTIFICATE_DOWNLOAD: 'certificate:download',

  MENTORSHIP_CREATE: 'mentorship:create',
  MENTORSHIP_MANAGE: 'mentorship:manage',

  YOUTH_PROFILE_MANAGE: 'youth:profile:manage',
  YOUTH_PROFILE_VIEW: 'youth:profile:view',

  FILE_UPLOAD: 'file:upload',

  CHAT_READ: 'chat:read',
  CHAT_SEND: 'chat:send',

  BLOG_CREATE: 'blog:create',
  BLOG_EDIT: 'blog:edit',
  BLOG_DELETE: 'blog:delete',
  BLOG_PUBLISH: 'blog:publish',
  BLOG_VIEW_ALL: 'blog:view:all',
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];

export const ROLE_ROUTES: Record<string, string> = {
  VOLUNTEER: '/volunteer/dashboard',
  COORDINATOR: '/coordinator/dashboard',
  ADMIN: '/admin/dashboard',
  OBSERVER: '/observer/dashboard',
  ORGANIZATION_ADMIN: '/organization/dashboard',
  PLATFORM_MANAGER: '/admin/dashboard',
};

export const ROLE_ROUTE_PREFIXES: Record<string, string[]> = {
  VOLUNTEER: ['/volunteer'],
  COORDINATOR: ['/coordinator'],
  ORGANIZATION_ADMIN: ['/organization'],
  ADMIN: ['/admin'],
  PLATFORM_MANAGER: ['/admin'],
  OBSERVER: ['/observer'],
};

export const ONBOARDING_ROUTES = ['/consent', '/setup-profile'];

export const ROLE_HIERARCHY: Record<string, number> = {
  OBSERVER: 0,
  VOLUNTEER: 1,
  COORDINATOR: 2,
  ORGANIZATION_ADMIN: 3,
  ADMIN: 4,
  PLATFORM_MANAGER: 4,
};

export function hasPermission(user: { permissions?: string[] } | null, permission: string): boolean {
  return user?.permissions?.includes(permission) ?? false;
}

export function canAccess(userRole: string, minimumRole: string): boolean {
  const userLevel = ROLE_HIERARCHY[userRole] ?? -1;
  const requiredLevel = ROLE_HIERARCHY[minimumRole] ?? -1;
  return userLevel >= requiredLevel;
}

export function isAtLeast(userRole: string, targetRole: string): boolean {
  return canAccess(userRole, targetRole);
}
