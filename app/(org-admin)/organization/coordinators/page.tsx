'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { z } from 'zod';
import { useAuth } from '../../../../hooks/useAuth';
import { api } from '../../../../lib/api';
import { SkeletonCard } from '../../../../components/shared/SkeletonCard';
import { useToast } from '../../../../hooks/use-toast';
import type { AxiosError } from 'axios';

const CreateCoordinatorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: z.string().email('Please enter a valid email address'),
});

const CoordinatorSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  status: z.string(),
});

type Coordinator = z.infer<typeof CoordinatorSchema>;

export default function OrganizationCoordinatorsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });

  const orgId = user?.organizationId;

  const { data, isLoading } = useQuery({
    queryKey: ['org-coordinators', orgId],
    queryFn: () =>
      api.get<Coordinator[]>(`/organizations/${orgId}/coordinators`).then((r) => r.data),
    enabled: !!orgId,
  });

  const addMut = useMutation({
    mutationFn: (data: { name: string; email: string }) => {
      const parsed = CreateCoordinatorSchema.parse(data);
      return api.post(`/organizations/${orgId}/coordinators`, parsed);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-coordinators', orgId] });
      setIsAdding(false);
      setFormData({ name: '', email: '' });
      toast({ title: 'Success', description: 'Coordinator added successfully' });
    },
    onError: (err: AxiosError<{ error: string }>) => {
      toast({
        title: 'Error',
        description: err.response?.data?.error || 'Failed to add coordinator',
        variant: 'destructive',
      });
    },
  });

  const removeMut = useMutation({
    mutationFn: (userId: string) => api.delete(`/organizations/${orgId}/coordinators/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-coordinators', orgId] });
      toast({ title: 'Success', description: 'Coordinator removed successfully' });
    },
    onError: (err: AxiosError<{ error: string }>) => {
      toast({
        title: 'Error',
        description: err.response?.data?.error || 'Failed to remove coordinator',
        variant: 'destructive',
      });
    },
  });

  if (!orgId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-brand-surface rounded-2xl border border-brand-border p-6 text-center card-hover">
        <h2 className="font-heading font-bold text-lg text-brand-text mb-2">
          No Organization Found
        </h2>
        <p className="text-brand-muted max-w-sm">
          You are not currently associated with an organization. Please register or join an
          organization first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-2xl text-brand-text">Coordinators</h1>
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-brand-primary text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-secondary active-bounce transition-all shadow-sm cursor-pointer"
        >
          <UserPlus className="w-4 h-4" aria-hidden="true" /> Add Coordinator
        </button>
      </div>

      {isAdding && (
        <div className="bg-brand-surface rounded-2xl border border-brand-border p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300 card-hover">
          <h2 className="font-heading font-bold text-lg text-brand-text mb-4">
            Add New Coordinator
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addMut.mutate(formData);
            }}
            className="grid gap-4 sm:grid-cols-2"
          >
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium text-brand-text">
                Name
              </label>
              <input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full Name"
                className="w-full px-4 py-2.5 rounded-xl border border-brand-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-brand-text">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-brand-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-sm font-medium text-brand-muted hover:text-brand-text transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addMut.isPending}
                className="bg-brand-primary text-white text-sm font-semibold px-6 py-2 rounded-xl hover:bg-brand-secondary disabled:opacity-50 active-bounce transition-all shadow-sm cursor-pointer"
              >
                {addMut.isPending ? 'Adding...' : 'Save Coordinator'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : data?.length === 0 ? (
        <div className="bg-brand-surface rounded-2xl border border-brand-border p-12 text-center card-hover">
          <div className="w-16 h-16 bg-brand-bg rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-brand-primary" aria-hidden="true" />
          </div>
          <p className="font-medium text-brand-text">No coordinators yet</p>
          <p className="text-sm text-brand-muted mt-1">
            Add your first coordinator to start managing your org.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.map((c) => (
            <div
              key={c.id}
              className="bg-brand-surface rounded-2xl border border-brand-border p-5 flex flex-col justify-between hover:shadow-md transition-shadow group card-hover"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-heading font-bold text-brand-text group-hover:text-brand-primary transition-colors truncate">
                    {c.name}
                  </h3>
                  <p className="text-sm text-brand-muted truncate">{c.email}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center text-brand-primary font-bold flex-shrink-0">
                  {c.name.charAt(0)}
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-brand-border flex items-center justify-between">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                  {c.status}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Are you sure you want to remove ${c.name}?`)) {
                      removeMut.mutate(c.id);
                    }
                  }}
                  className="p-2 text-brand-muted hover:text-brand-error hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                  aria-label="Remove coordinator"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
