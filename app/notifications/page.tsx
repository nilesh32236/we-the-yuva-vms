'use client';

import { AlertTriangle, ArrowLeft, Bell, CheckCheck, Info, Megaphone, Star } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const TYPE_ICON: Record<string, React.ElementType> = {
  info: Info,
  success: CheckCheck,
  warning: AlertTriangle,
  promotion: Megaphone,
  achievement: Star,
};

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

interface BackendNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

interface NotifResponse {
  data: BackendNotification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<NotifResponse>({
    queryKey: ['notifications', 'list'],
    queryFn: () => api.get('/notifications?limit=50').then((r) => r.data),
    staleTime: 30_000,
  });

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => api.get<{ count: number }>('/notifications/unread-count').then((r) => r.data),
  });

  const markReadMut = useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMut = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = data?.data ?? [];
  const unreadCount = unreadData?.count ?? 0;

  return (
    <div className="min-h-dvh bg-brand-bg">
      {/* Header */}
      <header className="h-16 bg-white border-b border-brand-border flex items-center px-4 md:px-6 gap-3 sticky top-0 z-30 flex-shrink-0">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-brand-muted hover:bg-brand-bg hover:text-brand-text transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="font-heading font-bold text-lg text-brand-text flex-1">Notifications</h1>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllReadMut.mutate()}
            className="text-xs text-brand-primary hover:underline cursor-pointer font-medium"
          >
            Mark all read
          </button>
        )}
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-1">
        {isLoading ? (
          <div className="text-center py-16 text-brand-muted text-sm">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Bell className="w-10 h-10 text-brand-muted mx-auto" />
            <p className="text-brand-muted text-sm">No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => {
            const Icon = TYPE_ICON[n.type] ?? Bell;
            return (
              <div
                key={n.id}
                className={`flex items-start gap-3 px-4 py-3 rounded-xl transition-colors ${!n.read ? 'bg-white' : ''} ${n.link ? 'cursor-pointer hover:bg-brand-bg' : ''}`}
                onClick={() => {
                  if (!n.read) markReadMut.mutate(n.id);
                  if (n.link) router.push(n.link);
                }}
                role={n.link ? 'button' : undefined}
                tabIndex={n.link ? 0 : undefined}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && n.link) router.push(n.link);
                }}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${!n.read ? 'bg-brand-primary' : 'bg-brand-bg'}`}
                >
                  <Icon className={`w-4 h-4 ${!n.read ? 'text-white' : 'text-brand-muted'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium leading-snug ${!n.read ? 'text-brand-text' : 'text-brand-muted/80'}`}
                  >
                    {n.title}
                  </p>
                  <p className="text-xs text-brand-muted mt-0.5 line-clamp-2">{n.body}</p>
                  <p className="text-[10px] text-brand-muted mt-1">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read && (
                  <span className="w-2 h-2 rounded-full bg-brand-primary flex-shrink-0 mt-2.5" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
