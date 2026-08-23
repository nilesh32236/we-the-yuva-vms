export const queryKeys = {
  adminUsers: {
    all: ['admin-users'] as const,
    list: (filters: { search: string; role: string; status: string; page: number }) =>
      ['admin-users', filters.search, filters.role, filters.status, filters.page] as const,
  },
  opportunities: {
    all: ['opportunities'] as const,
    list: (filters: { search: string; category: string; page: number }) =>
      ['opportunities', 'list', filters.search, filters.category, filters.page] as const,
    recommended: () => ['opportunities', 'recommended'] as const,
    detail: (id: string) => ['opportunity', id] as const,
  },
  applications: {
    my: () => ['my-applications'] as const,
  },
  locations: {
    list: () => ['locations'] as const,
  },
  myLevel: () => ['my-level'] as const,
  myPoints: () => ['my-points'] as const,
  myPointsHistory: () => ['my-points-history'] as const,
  notifications: {
    recent: () => ['notifications', 'recent'] as const,
    unreadCount: () => ['notifications', 'unread-count'] as const,
  },
  adminBadges: {
    all: ['admin-badge-pending'] as const,
    pending: (search: string) => ['admin-badge-pending', search] as const,
  },
};