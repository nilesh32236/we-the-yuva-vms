'use client';

import { MoreVertical } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '../../hooks/use-toast';
import { api } from '../../lib/api';

const ROLE_COLORS: Record<string, string> = {
  VOLUNTEER: 'bg-emerald-100 text-emerald-700',
  COORDINATOR: 'bg-cyan-100 text-cyan-700',
  ADMIN: 'bg-purple-100 text-purple-700',
  OBSERVER: 'bg-slate-100 text-slate-700',
};
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  INACTIVE: 'bg-gray-100 text-gray-600',
  SUSPENDED: 'bg-red-100 text-red-700',
};

interface User {
  id: string;
  name: string;
  email: string | null;
  role: string;
  status: string;
  createdAt: string;
}

interface UserTableProps {
  users: User[];
  onUpdated: () => void;
}

export function UserTable({ users, onUpdated }: UserTableProps) {
  const { toast } = useToast();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const update = async (id: string, data: object, msg: string) => {
    setLoading(id);
    try {
      await api.patch(`/admin/users/${id}`, data);
      toast({ title: msg });
      onUpdated();
    } catch {
      toast({ title: 'Error', description: 'Could not update user.', variant: 'destructive' });
    } finally {
      setLoading(null);
      setOpenMenu(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-brand-border overflow-hidden">
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
                className="text-left px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide hidden md:table-cell"
              >
                Joined
              </th>
              <th scope="col" className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-brand-bg/50 transition-colors">
                <td className="px-4 py-3 font-medium text-brand-text">{u.name}</td>
                <td className="px-4 py-3 text-brand-muted hidden sm:table-cell">
                  {u.email ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role] ?? ''}`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[u.status] ?? ''}`}
                  >
                    {u.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-brand-muted hidden md:table-cell">
                  {new Date(u.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className="px-4 py-3 relative">
                  <button
                    onClick={() => setOpenMenu(openMenu === u.id ? null : u.id)}
                    className="p-1.5 rounded-lg hover:bg-brand-bg text-brand-muted hover:text-brand-text transition-colors cursor-pointer"
                    disabled={loading === u.id}
                    aria-label={`Actions for ${u.name}`}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {openMenu === u.id && (
                    <div
                      className="absolute right-4 top-10 z-20 bg-white border border-brand-border rounded-xl shadow-lg py-1 min-w-[160px]"
                      role="menu"
                    >
                      {u.status !== 'ACTIVE' && (
                        <button
                          onClick={() => update(u.id, { status: 'ACTIVE' }, 'User activated')}
                          className="w-full text-left px-4 py-2 text-sm text-emerald-700 hover:bg-brand-bg cursor-pointer"
                          aria-label={`Activate ${u.name}`}
                          role="menuitem"
                        >
                          Activate
                        </button>
                      )}
                      {u.status !== 'SUSPENDED' && (
                        <button
                          onClick={() => update(u.id, { status: 'SUSPENDED' }, 'User suspended')}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-brand-bg cursor-pointer"
                          aria-label={`Suspend ${u.name}`}
                          role="menuitem"
                        >
                          Suspend
                        </button>
                      )}
                      {(['VOLUNTEER', 'COORDINATOR', 'OBSERVER'] as const).map(
                        (role) =>
                          u.role !== role && (
                            <button
                              key={role}
                              onClick={() => update(u.id, { role }, `Role changed to ${role}`)}
                              className="w-full text-left px-4 py-2 text-sm text-brand-text hover:bg-brand-bg cursor-pointer"
                              aria-label={`Change role to ${role}`}
                              role="menuitem"
                            >
                              Make {role.charAt(0) + role.slice(1).toLowerCase()}
                            </button>
                          )
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
