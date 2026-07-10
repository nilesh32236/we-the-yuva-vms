const SYSTEM_ROLES = new Set(['ADMIN', 'PLATFORM_MANAGER']);

export function hasSystemRole(role: string): boolean {
  return SYSTEM_ROLES.has(role);
}
