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

  // Tier / Level System
  LEVEL_VIEW: 'level:view',
  LEVEL_REQUEST: 'level:request',
  LEVEL_REVIEW: 'level:review',

  BADGE_APPROVE: 'badge:approve',

  CERTIFICATE_VIEW: 'certificate:view',
  CERTIFICATE_DOWNLOAD: 'certificate:download',

  // Mentorship
  MENTORSHIP_CREATE: 'mentorship:create',
  MENTORSHIP_MANAGE: 'mentorship:manage',

  // Youth Profiling
  YOUTH_PROFILE_MANAGE: 'youth:profile:manage',
  YOUTH_PROFILE_VIEW: 'youth:profile:view',

  // Upload
  FILE_UPLOAD: 'file:upload',

  // Chat
  CHAT_READ: 'chat:read',
  CHAT_SEND: 'chat:send',

  // Blog
  BLOG_CREATE: 'blog:create',
  BLOG_EDIT: 'blog:edit',
  BLOG_DELETE: 'blog:delete',
  BLOG_PUBLISH: 'blog:publish',
  BLOG_VIEW_ALL: 'blog:view:all',
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];
