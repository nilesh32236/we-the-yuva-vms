/**
 * RBAC constants and guards — the single source of truth for how the frontend
 * reasons about roles and permissions (audit #203).
 *
 * POLICY (consensus):
 * - Every `Permissions.*` constant below MUST be referenced by at least one
 *   client-side `hasPermission()` / `hasAccess()` guard. Constants with no
 *   UI wiring have been removed so the object reflects real behavior instead
 *   of implying an RBAC surface that does not exist.
 * - Role vs explicit-permission precedence is resolved in ONE place:
 *   `hasAccess()`. Prefer it over ad-hoc `hasPermission()` || role-threshold
 *   chains so the whole app makes a consistent choice.
 * - Client-side guards are defense-in-depth only — the backend enforces the
 *   real permission on every affected endpoint.
 */
export const Permissions = {
  USER_MANAGE: 'user:manage',

  OPPORTUNITY_CREATE: 'opportunity:create',
  OPPORTUNITY_EDIT: 'opportunity:edit',

  EVENT_CREATE: 'event:create',
  EVENT_EDIT: 'event:edit',
  EVENT_MANAGE: 'event:manage',
  EVENT_CHECKIN: 'event:checkin',

  BADGE_APPROVE: 'badge:approve',

  CERTIFICATE_DOWNLOAD: 'certificate:download',

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

// Single source of truth for which roles require a locationId / setup-profile
// step before they may enter their dashboard. Kept here (instead of duplicated
// literals across auth-context / proxy) so a role change needs one edit.
export const REQUIRES_LOCATION_ROLES: readonly string[] = [
  'COORDINATOR',
  'ADMIN',
  'OBSERVER',
  'ORGANIZATION_ADMIN',
  'PLATFORM_MANAGER',
];

/**
 * Inherits permissions from the role hierarchy. Fails closed for unknown roles
 * and for any user where `permissions` is undefined (or null).
 *
 * NOTE: `user.permissions` is ONLY populated by the backend's `/users/me`
 * stream (from the role's permission set). If a feature cannot rely on the
 * server streaming it, route the check through `hasAccess()` instead of
 * depending purely on the permission array.
 */
export function hasPermission(user: { permissions?: string[] } | null, permission: string): boolean {
  return user?.permissions?.includes(permission) ?? false;
}

/**
 * Canonical guard resolving role threshold OR explicit permission in one place.
 *
 * A user is granted access if they hold `permission` OR their role is at least
 * `minimumRole`. Pass either/both; returns false when both are absent or the
 * user is unknown. Use this file's single decision point instead of writing
 * ad-hoc `hasPermission(...) || canAccess(...)` chains across components.
 */
export function hasAccess(
  user: { role?: string; permissions?: string[] } | null,
  options: { permission?: Permission; minimumRole?: string }
): boolean {
  if (!user) return false;
  if (options.permission && hasPermission(user, options.permission)) return true;
  if (options.minimumRole) {
    const userLevel = ROLE_HIERARCHY[user.role ?? ''];
    const requiredLevel = ROLE_HIERARCHY[options.minimumRole];
    // Fail closed: both the user's role and the minimum role must be known
    // levels for a role-threshold grant. An unknown role (or a typo'd
    // minimumRole) must never authorize.
    if (userLevel === undefined || requiredLevel === undefined) return false;
    return userLevel >= requiredLevel;
  }
  return false;
}