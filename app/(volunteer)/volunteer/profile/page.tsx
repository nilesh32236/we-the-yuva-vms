'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  BellRing,
  Calendar,
  Check,
  Clock,
  Edit2,
  Mail,
  Settings,
  Tag,
  User,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { api } from '../../../../lib/api';
import { useAuth } from '../../../../hooks/useAuth';
import { useToast } from '../../../../hooks/use-toast';

export default function VolunteerProfilePage() {
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [interests, setInterests] = useState('');

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/users/me').then((r) => r.data),
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: (body: object) => api.put('/users/me/profile', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] });
      setEditing(false);
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast({ title: 'Error', description: err?.response?.data?.error || 'Failed to update profile', variant: 'destructive' });
    },
  });

  function startEdit() {
    setBio(user?.profile?.bio ?? '');
    setSkills((user?.profile?.skills ?? []).join(', '));
    setInterests((user?.profile?.interests ?? []).join(', '));
    setEditing(true);
  }

  function save() {
    mutation.mutate({
      bio,
      skills: skills
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean),
      interests: interests
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean),
      availability: user?.profile?.availability ?? { days: [], timeSlots: [] },
    });
  }

  const initials =
    user?.name
      ?.split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ?? '?';

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-40 text-brand-muted text-sm">Loading…</div>
    );

  return (
    <div className="max-w-2xl space-y-5">
      {/* Header card */}
      <div className="bg-white rounded-2xl border border-brand-border overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-emerald-500 to-teal-400" />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-brand-primary border-4 border-white flex items-center justify-center shadow-md">
              <span className="text-white font-heading font-bold text-2xl">{initials}</span>
            </div>
            {!editing ? (
              <button
                onClick={startEdit}
                className="flex items-center gap-1.5 text-sm font-medium text-brand-primary hover:bg-brand-bg px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-1 text-sm text-brand-muted hover:text-brand-text px-3 py-1.5 rounded-lg border border-brand-border transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
                <button
                  onClick={save}
                  disabled={mutation.isPending}
                  className="flex items-center gap-1 text-sm font-medium text-white bg-brand-primary hover:bg-brand-secondary px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-60"
                >
                  <Check className="w-3.5 h-3.5" /> Save
                </button>
              </div>
            )}
          </div>
          <h1 className="font-heading font-bold text-xl text-brand-text">{user?.name}</h1>
          <div className="flex items-center gap-1.5 mt-1 text-brand-muted text-sm">
            <Mail className="w-3.5 h-3.5" />
            <span>{user?.email}</span>
          </div>
          <span className="inline-block mt-2 text-xs font-semibold bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full">
            Volunteer
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Clock, label: 'Total Hours', value: `${user?.profile?.totalHours ?? 0}h` },
          {
            icon: Calendar,
            label: 'Member Since',
            value: new Date(user?.createdAt).toLocaleDateString('en-IN', {
              month: 'short',
              year: 'numeric',
            }),
          },
          { icon: User, label: 'Status', value: user?.status ?? 'Active' },
        ].map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-brand-border p-4 text-center"
          >
            <Icon className="w-4 h-4 text-brand-primary mx-auto mb-1.5" />
            <p className="font-heading font-bold text-lg text-brand-text">{value}</p>
            <p className="text-xs text-brand-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Bio */}
      <div className="bg-white rounded-2xl border border-brand-border p-5 space-y-2">
        <h2 className="font-heading font-semibold text-sm text-brand-text">About</h2>
        {editing ? (
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="Tell us about yourself…"
            className="w-full text-sm text-brand-text border border-brand-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 resize-none"
          />
        ) : (
          <p className="text-sm text-brand-muted">{user?.profile?.bio || 'No bio added yet.'}</p>
        )}
      </div>

      {/* Skills */}
      <div className="bg-white rounded-2xl border border-brand-border p-5 space-y-3">
        <h2 className="font-heading font-semibold text-sm text-brand-text flex items-center gap-2">
          <Tag className="w-4 h-4 text-brand-primary" /> Skills
        </h2>
        {editing ? (
          <input
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="e.g. Teaching, Design, Coding"
            className="w-full text-sm border border-brand-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            {(user?.profile?.skills ?? []).length > 0 ? (
              user.profile.skills.map((s: string) => (
                <span
                  key={s}
                  className="text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full"
                >
                  {s}
                </span>
              ))
            ) : (
              <p className="text-sm text-brand-muted">No skills added yet.</p>
            )}
          </div>
        )}
      </div>

      {/* Interests */}
      <div className="bg-white rounded-2xl border border-brand-border p-5 space-y-3">
        <h2 className="font-heading font-semibold text-sm text-brand-text flex items-center gap-2">
          <Tag className="w-4 h-4 text-teal-500" /> Interests
        </h2>
        {editing ? (
          <input
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            placeholder="e.g. Environment, Education, Health"
            className="w-full text-sm border border-brand-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            {(user?.profile?.interests ?? []).length > 0 ? (
              user.profile.interests.map((s: string) => (
                <span
                  key={s}
                  className="text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-1 rounded-full"
                >
                  {s}
                </span>
              ))
            ) : (
              <p className="text-sm text-brand-muted">No interests added yet.</p>
            )}
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="bg-white rounded-2xl border border-brand-border p-5 space-y-3">
        <h2 className="font-heading font-semibold text-sm text-brand-text flex items-center gap-2">
          <Settings className="w-4 h-4 text-brand-muted" /> Settings
        </h2>
        <div className="space-y-2">
          <Link
            href="/volunteer/settings/notifications"
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-brand-bg transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4 text-brand-muted" />
            <div>
              <p className="text-sm font-medium text-brand-text">Notification Preferences</p>
              <p className="text-xs text-brand-muted">Manage email and push notification types</p>
            </div>
          </Link>
          <Link
            href="/volunteer/settings/alerts"
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-brand-bg transition-colors cursor-pointer"
          >
            <BellRing className="w-4 h-4 text-brand-muted" />
            <div>
              <p className="text-sm font-medium text-brand-text">Opportunity Alerts</p>
              <p className="text-xs text-brand-muted">
                Get notified about new opportunities matching your interests
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
