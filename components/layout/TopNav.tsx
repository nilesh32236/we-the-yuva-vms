'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Bell, CheckCheck, Info, LogOut, Megaphone, Star } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  VOLUNTEER: { label: 'Volunteer', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  COORDINATOR: { label: 'Coordinator', color: 'text-cyan-700', bg: 'bg-cyan-100' },
  ADMIN: { label: 'Admin', color: 'text-purple-700', bg: 'bg-purple-100' },
  OBSERVER: { label: 'Observer', color: 'text-slate-700', bg: 'bg-slate-100' },
};

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

export function TopNav() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => api.get<{ count: number }>('/notifications/unread-count').then((r) => r.data),
    refetchInterval: 30000,
  });

  const { data: notifData } = useQuery({
    queryKey: ['notifications', 'recent'],
    queryFn: () =>
      api.get<{ data: BackendNotification[] }>('/notifications?limit=5').then((r) => r.data),
    enabled: open,
  });

  const markReadMut = useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMut = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = unreadData?.count ?? 0;
  const items = notifData?.data ?? [];
  const panelRef = useRef<HTMLDivElement>(null);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  const role = ROLE_CONFIG[user?.role ?? ''];

  // Close panel on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <header className="h-16 bg-white border-b border-brand-border flex items-center px-4 md:px-6 gap-4 sticky top-0 z-30 flex-shrink-0">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
        <div className="w-8 h-8 rounded-xl bg-brand-primary flex items-center justify-center shadow-sm">
          <span className="text-white font-heading font-bold text-sm">W</span>
        </div>
        <div className="hidden sm:block">
          <span className="font-heading font-bold text-brand-text text-base leading-none">
            WeTheYuva
          </span>
          <span className="block text-brand-muted text-[10px] leading-none mt-0.5">VMS</span>
        </div>
      </Link>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <div className="relative" ref={panelRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-brand-muted hover:bg-brand-bg hover:text-brand-text transition-colors duration-200 cursor-pointer relative"
            aria-label="Notifications"
            aria-haspopup="true"
            aria-expanded={open}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-white flex items-center justify-center">
                <span className="text-white text-[9px] font-bold leading-none">{unreadCount}</span>
              </span>
            )}
          </button>

          {/* Dropdown panel */}
          {open && (
            <div
              className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-xl border border-brand-border overflow-hidden z-50"
              role="menu"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border">
                <h3 className="font-heading font-semibold text-sm text-brand-text">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => markAllReadMut.mutate()}
                    className="text-xs text-brand-primary hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Items */}
              <div className="divide-y divide-brand-border max-h-72 overflow-y-auto">
                {items.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-brand-muted">
                    No notifications
                  </div>
                ) : (
                  items.map((n) => {
                    const Icon = TYPE_ICON[n.type] ?? Bell;
                    return (
                      <button
                        type="button"
                        key={n.id}
                        onClick={() => markReadMut.mutate(n.id)}
                        className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-brand-bg transition-colors cursor-pointer ${!n.read ? 'bg-emerald-50/50' : ''}`}
                        role="menuitem"
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${!n.read ? 'bg-brand-primary' : 'bg-brand-bg'}`}
                        >
                          <Icon
                            className={`w-4 h-4 ${!n.read ? 'text-white' : 'text-brand-muted'}`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium leading-snug ${!n.read ? 'text-brand-text' : 'text-brand-muted'}`}
                          >
                            {n.title}
                          </p>
                          <p className="text-xs text-brand-muted mt-0.5 line-clamp-1">{n.body}</p>
                          <p className="text-[10px] text-brand-muted mt-1">
                            {timeAgo(n.createdAt)}
                          </p>
                        </div>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-brand-primary flex-shrink-0 mt-2" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 border-t border-brand-border bg-brand-bg/50 text-center text-xs text-brand-primary hover:underline"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-brand-border mx-1" />

        {/* User info */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-primary flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-white text-xs font-bold">{initials}</span>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-brand-text leading-none">
              {user?.name ?? '—'}
            </p>
            {role && (
              <span
                className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5 ${role.bg} ${role.color}`}
              >
                {role.label}
              </span>
            )}
          </div>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={logout}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-brand-muted hover:bg-red-50 hover:text-red-600 transition-colors duration-200 cursor-pointer"
          aria-label="Log out"
          title="Log out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
