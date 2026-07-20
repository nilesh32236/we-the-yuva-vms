'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MoreVertical } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import * as Sentry from '@sentry/nextjs';

const ROLE_COLORS: Record<string, string> = {
  VOLUNTEER: 'bg-brand-primary/10 text-brand-primary',
  COORDINATOR: 'bg-brand-cta/10 text-brand-cta',
  ADMIN: 'bg-purple-100 text-purple-700',
  OBSERVER: 'bg-slate-100 text-slate-700',
};
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  INACTIVE: 'bg-muted text-muted-foreground',
  SUSPENDED: 'bg-red-100 text-red-700',
};

interface User {
  id: string;
  name: string;
  email: string | null;
  roleRef: { name: string };
  status: string;
  volunteerType?: string | null;
  createdAt: string;
}

interface UserTableProps {
  users: User[];
  onUpdated: () => void;
}

export function UserTable({ users = [], onUpdated }: UserTableProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) =>
      api.patch(`/admin/users/${id}`, data),
    onSuccess: (_data, variables) => {
      const msg = (variables.data as { status?: string; role?: string }).status
        ? `User ${(variables.data as { status?: string }).status?.toLowerCase()}`
        : `Role changed to ${(variables.data as { role?: string }).role}`;
      toast({ title: msg });
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      onUpdated();
    },
    onError: (err: unknown) => {
      Sentry.captureException(err);
      toast({
        title: 'Error',
        description: 'Could not update user.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setOpenMenu(null);
      setMenuPosition(null);
    },
  });

  // Close menu on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
        setMenuPosition(null);
      }
    }
    if (openMenu) {
      document.addEventListener('mousedown', handler);
    }
    return () => document.removeEventListener('mousedown', handler);
  }, [openMenu]);

  function handleMenuClick(id: string, e: React.MouseEvent) {
    if (openMenu === id) {
      setOpenMenu(null);
      setMenuPosition(null);
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuPosition({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    setOpenMenu(id);
  }

  const pendingId = updateMutation.isPending
    ? (updateMutation.variables as { id?: string })?.id
    : null;

  return (
    <div className="bg-brand-surface rounded-2xl border border-brand-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border bg-brand-bg">
              <th
                scope="col"
                className="text-left px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide"
              >
                Name
              </th>
              <th
                scope="col"
                className="text-left px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide hidden md:table-cell"
              >
                Type
              </th>
              <th
                scope="col"
                className="text-left px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide hidden sm:table-cell"
              >
                Email
              </th>
              <th
                scope="col"
                className="text-left px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide"
              >
                Role
              </th>
              <th
                scope="col"
                className="text-left px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide"
              >
                Status
              </th>
              <th
                scope="col"
                className="text-left px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide hidden lg:table-cell"
              >
                Joined
              </th>
              <th scope="col" className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-brand-muted text-sm">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-brand-bg/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-brand-text">{u.name}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {u.volunteerType ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted/70">
                        {u.volunteerType}
                      </span>
                    ) : (
                      <span className="text-brand-muted/30">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-brand-muted hidden sm:table-cell">
                    {u.email ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[u.roleRef.name] ?? ''}`}
                    >
                      {u.roleRef.name}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[u.status] ?? ''}`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-brand-muted hidden lg:table-cell">
                    {new Date(u.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 relative">
                    <button
                      type="button"
                      onClick={(e) => handleMenuClick(u.id, e)}
                      className="p-3 rounded-lg hover:bg-brand-bg text-brand-muted hover:text-brand-text active:scale-90 transition-colors cursor-pointer min-h-[44px] min-w-[44px]"
                      disabled={pendingId === u.id}
                      aria-label={`Actions for ${u.name}`}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Fixed-position dropdown rendered at body level via portal-like positioning */}
      {openMenu && menuPosition && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setOpenMenu(null);
              setMenuPosition(null);
            }}
            aria-hidden="true"
          />
          <div
            ref={menuRef}
            className="fixed z-50 bg-brand-surface border border-brand-border rounded-xl shadow-xl py-1.5 min-w-[180px] motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 duration-150"
            style={{ top: menuPosition.top, right: menuPosition.right }}
            role="menu"
          >
            {(() => {
              const user = users.find((u) => u.id === openMenu);
              if (!user) return null;
              return (
                <>
                  {user.status !== 'ACTIVE' && (
                    <button
                      type="button"
                      onClick={() =>
                        updateMutation.mutate({ id: user.id, data: { status: 'ACTIVE' } })
                      }
                      className="w-full text-left px-4 py-2.5 text-sm text-brand-primary hover:bg-brand-bg cursor-pointer transition-colors flex items-center gap-2 min-h-[44px]"
                      aria-label={`Activate ${user.name}`}
                      role="menuitem"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Activate
                    </button>
                  )}
                  {user.status !== 'SUSPENDED' && (
                    <button
                      type="button"
                      onClick={() =>
                        updateMutation.mutate({ id: user.id, data: { status: 'SUSPENDED' } })
                      }
                      className="w-full text-left px-4 py-2.5 text-sm text-brand-error hover:bg-brand-bg cursor-pointer transition-colors flex items-center gap-2 min-h-[44px]"
                      aria-label={`Suspend ${user.name}`}
                      role="menuitem"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      Suspend
                    </button>
                  )}
                  {(['VOLUNTEER', 'COORDINATOR', 'OBSERVER'] as const).map(
                    (role) =>
                      user.roleRef.name !== role && (
                        <button
                          type="button"
                          key={role}
                          onClick={() => updateMutation.mutate({ id: user.id, data: { role } })}
                          className="w-full text-left px-4 py-2.5 text-sm text-brand-text hover:bg-brand-bg cursor-pointer transition-colors flex items-center gap-2 min-h-[44px]"
                          aria-label={`Change role to ${role}`}
                          role="menuitem"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                          Make {role.charAt(0) + role.slice(1).toLowerCase()}
                        </button>
                      )
                  )}
                </>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
}
