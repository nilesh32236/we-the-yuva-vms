'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, X } from 'lucide-react';
import { useState } from 'react';
import Pagination from '@/components/shared/Pagination';
import { UserTable } from '../../../../components/admin/UserTable';
import { SkeletonCard } from '../../../../components/shared/SkeletonCard';
import { Button } from '@/components/ui/Button';
import { useToast } from '../../../../hooks/use-toast';
import { useFocusTrap } from '../../../../hooks/useFocusTrap';
import { api } from '../../../../lib/api';

const ROLES = ['ALL', 'VOLUNTEER', 'COORDINATOR', 'ADMIN', 'OBSERVER'];
const STATUSES = ['ALL', 'ACTIVE', 'PENDING', 'INACTIVE', 'SUSPENDED'];
const CREATE_ROLES = ['VOLUNTEER', 'COORDINATOR', 'ADMIN', 'OBSERVER'];

function CreateUserModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', role: 'VOLUNTEER', locationName: '' });
  const dialogRef = useFocusTrap(true);

  const create = useMutation({
    mutationFn: () =>
      api.post('/admin/users', {
        name: form.name,
        email: form.email,
        role: form.role,
        locationName: form.locationName || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: 'User created',
        description: `${form.name} can now log in with ${form.email}`,
      });
      onClose();
    },
    onError: (e: { response?: { data?: { error?: string } } }) =>
      toast({
        title: 'Failed',
        description: e?.response?.data?.error ?? 'Try again',
        variant: 'destructive',
      }),
  });

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-user-title"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="bg-brand-surface rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
          <h2 id="create-user-title" className="font-heading font-bold text-lg text-brand-text">
            Create User
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-brand-bg cursor-pointer transition-colors"
          >
            <X className="w-4 h-4 text-brand-muted" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label
              htmlFor="create-name"
              className="block text-xs font-semibold text-brand-text mb-1.5"
            >
              Full Name *
            </label>
            <input
              id="create-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Priya Sharma"
              className="w-full px-3 py-2.5 rounded-xl border border-brand-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          <div>
            <label
              htmlFor="create-email"
              className="block text-xs font-semibold text-brand-text mb-1.5"
            >
              Email *
            </label>
            <input
              id="create-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="e.g. priya@example.com"
              className="w-full px-3 py-2.5 rounded-xl border border-brand-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          <div>
            <label
              htmlFor="create-role"
              className="block text-xs font-semibold text-brand-text mb-1.5"
            >
              Role *
            </label>
            <select
              id="create-role"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-brand-border text-sm bg-brand-surface focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              {CREATE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0) + r.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          {form.role !== 'VOLUNTEER' && (
            <div>
              <label
                htmlFor="create-location"
                className="block text-xs font-semibold text-brand-text mb-1.5"
              >
                Location (optional)
              </label>
              <input
                id="create-location"
                value={form.locationName}
                onChange={(e) => setForm((f) => ({ ...f, locationName: e.target.value }))}
                placeholder="e.g. Mumbai"
                className="w-full px-3 py-2.5 rounded-xl border border-brand-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
          )}

          <p className="text-xs text-brand-muted bg-brand-bg rounded-xl px-3 py-2.5">
            The user will log in using OTP sent to their email. Their account is created as{' '}
            <strong>Active</strong> with consent pre-accepted.
          </p>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => create.mutate()}
            disabled={!form.name || !form.email}
            loading={create.isPending}
            className="flex-1"
          >
            Create User
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, role, status, page],
    queryFn: () =>
      api
        .get('/admin/users', {
          params: {
            search: search || undefined,
            role: role === 'ALL' ? undefined : role,
            status: status === 'ALL' ? undefined : status,
            page,
            limit: 20,
          },
        })
        .then((r) => r.data),
    staleTime: 30_000,
  });

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-xl text-brand-text">Users</h1>
        <Button type="button" variant="primary" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" /> Create User
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name or email…"
            aria-label="Search users by name or email"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-brand-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </div>
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2.5 rounded-xl border border-brand-border text-sm bg-brand-surface focus:outline-none focus:ring-2 focus:ring-brand-primary"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r === 'ALL' ? 'All roles' : r.charAt(0) + r.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2.5 rounded-xl border border-brand-border text-sm bg-brand-surface focus:outline-none focus:ring-2 focus:ring-brand-primary"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === 'ALL' ? 'All statuses' : s.charAt(0) + s.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : !data?.data?.length ? (
        <div className="text-center py-12 text-brand-muted text-sm">No users found</div>
      ) : (
        <>
          <UserTable
            users={data?.data ?? []}
            onUpdated={() => qc.invalidateQueries({ queryKey: ['admin-users'] })}
          />
          <Pagination page={page} totalPages={data.totalPages} setPage={setPage} />
          {data?.total && (
            <p className="text-sm text-brand-muted text-center mt-2">{data.total} total users</p>
          )}
        </>
      )}

      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
