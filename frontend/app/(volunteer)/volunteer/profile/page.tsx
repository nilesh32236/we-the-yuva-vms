'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Bell,
  BellRing,
  Calendar,
  Check,
  Clock,
  Edit2,
  GraduationCap,
  Loader2,
  Mail,
  Settings,
  Tag,
  User,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DAYS, TIME_SLOTS } from '@/lib/shared';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/use-toast';
import { LevelBadge } from '@/components/levels/LevelBadge';
import { StreakBadge } from '@/components/levels/StreakBadge';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { haptic } from '@/lib/haptic';

const profileSchema = z
  .object({
    volunteerType: z.string().min(1, 'Please select a volunteer type'),
    bio: z.string().optional(),
    skills: z.string().optional(),
    interests: z.string().optional(),
    education: z.string().optional(),
    days: z.array(z.string()).min(1, 'Please select at least one day'),
    timeSlots: z.array(z.string()).min(1, 'Please select at least one time slot'),
  })
  .refine(
    (data) => {
      if (data.volunteerType === 'STUDENT' && !data.education) {
        return false;
      }
      return true;
    },
    { message: 'Education is required for student volunteers', path: ['education'] }
  );

export default function VolunteerProfilePage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const cancelRef = useRef(false);
  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      volunteerType: '',
      bio: '',
      skills: '',
      interests: '',
      education: '',
      days: [] as string[],
      timeSlots: [] as string[],
    },
  });
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setError,
    watch,
  } = form;
  const bio = watch('bio');
  const volunteerType = watch('volunteerType');
  const skills = watch('skills');
  const interests = watch('interests');
  const education = watch('education');
  const selectedDays = watch('days');
  const selectedSlots = watch('timeSlots');

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/users/me').then((r) => r.data),
    staleTime: 60_000,
  });

  const { data: levelData } = useQuery<{ data: { tier: number; points: number; streak: number } }>({
    queryKey: ['my-level'],
    queryFn: () => api.get('/levels/users/me/level').then((r) => r.data),
    staleTime: 60_000,
  });

  const { data: pendingBadges } = useQuery({
    queryKey: ['my-pending-badges'],
    queryFn: () => api.get('/badges/me').then((r) => r.data),
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: (body: object) => api.put('/users/me/profile', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] });
      setEditing(false);
      setDirty(false);
      toast({ title: 'Profile updated successfully' });
    },
    onError: (err: {
      response?: {
        data?: { error?: string; details?: { fieldErrors?: Record<string, string[]> } };
      };
    }) => {
      const details = err?.response?.data?.details;
      if (details?.fieldErrors) {
        for (const [key, msgs] of Object.entries(details.fieldErrors)) {
          if (msgs.length > 0)
            setError(key as Parameters<typeof setError>[0], { message: msgs.join(', ') });
        }
      }
      toast({
        title: 'Error',
        description: err?.response?.data?.error || 'Failed to update profile',
        variant: 'destructive',
      });
    },
  });

  function startEdit() {
    reset({
      volunteerType: user?.volunteerType ?? '',
      bio: user?.profile?.bio ?? '',
      skills: (user?.profile?.skills ?? []).join(', '),
      interests: (user?.profile?.interests ?? []).join(', '),
      education: user?.profile?.education ?? '',
      days: user?.profile?.availability?.days ?? [],
      timeSlots: user?.profile?.availability?.timeSlots ?? [],
    });
    setDirty(false);
    cancelRef.current = false;
    setEditing(true);
  }

  const cancelEdit = useCallback(function cancelEdit() {
    setEditing(false);
    setDirty(false);
  }, []);

  const hasChanges = useCallback(
    function hasChanges() {
      return (
        bio !== (user?.profile?.bio ?? '') ||
        volunteerType !== (user?.volunteerType ?? '') ||
        skills !== (user?.profile?.skills ?? []).join(', ') ||
        interests !== (user?.profile?.interests ?? []).join(', ') ||
        education !== (user?.profile?.education ?? '') ||
        JSON.stringify(selectedDays) !== JSON.stringify(user?.profile?.availability?.days ?? []) ||
        JSON.stringify(selectedSlots) !==
          JSON.stringify(user?.profile?.availability?.timeSlots ?? [])
      );
    },
    [bio, volunteerType, skills, interests, education, selectedDays, selectedSlots, user]
  );

  const save = handleSubmit((data) => {
    haptic.medium();
    mutation.mutate({
      volunteerType: data.volunteerType,
      bio: data.bio,
      skills: (data.skills ?? '')
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean),
      interests: (data.interests ?? '')
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean),
      education: data.education || undefined,
      availability: { days: data.days, timeSlots: data.timeSlots },
    });
  });

  // Unsaved changes warning
  useEffect(() => {
    if (!editing) return;
    setDirty(hasChanges());
  }, [editing, hasChanges]);

  useEffect(() => {
    if (!editing || !dirty) return;
    function handler(e: MouseEvent) {
      if (cancelRef.current) return;
      const target = e.target as HTMLElement;
      if (!target.closest('[data-profile-editor]') && !target.closest('.Toastify')) {
        const confirmed = window.confirm(
          'You have unsaved changes. Are you sure you want to leave?'
        );
        if (!confirmed) {
          e.stopPropagation();
          e.preventDefault();
        } else {
          cancelEdit();
        }
      }
    }
    // Use capture phase to catch clicks outside
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, [editing, dirty, cancelEdit]);

  // Beforeunload for browser navigation
  useEffect(() => {
    if (!editing || !dirty) return;
    function handler(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [editing, dirty]);

  const initials =
    user?.name
      ?.split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ?? '?';

  const inputCls = (field: string) =>
    `w-full text-base border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 transition-colors bg-background ${
      (errors as Record<string, unknown>)[field]
        ? 'border-brand-error focus:ring-brand-error/30 bg-brand-error/5'
        : 'border-brand-border focus:ring-brand-primary/30'
    }`;

  const selectCls = (field: string) =>
    `w-full text-base border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 transition-colors bg-background ${
      (errors as Record<string, unknown>)[field]
        ? 'border-brand-error focus:ring-brand-error/30 bg-brand-error/5'
        : 'border-brand-border focus:ring-brand-primary/30'
    }`;

  if (isLoading)
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center justify-center h-40 text-brand-muted text-sm"
      >
        Loading…
      </div>
    );

  const editorContent = (
    <div data-profile-editor>
      {/* Volunteer Type */}
      <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 space-y-3">
        <label
          htmlFor="volunteerType"
          className="font-heading font-semibold text-sm text-brand-text"
        >
          Volunteer Type
        </label>
        <select
          id="volunteerType"
          {...register('volunteerType')}
          disabled={mutation.isPending}
          className={selectCls('volunteerType')}
        >
          <option value="">Select Type</option>
          {['STUDENT', 'PROFESSIONAL', 'EVENT', 'RECURRING', 'REMOTE', 'EMERGENCY'].map((t) => (
            <option key={t} value={t}>
              {t.charAt(0) + t.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
        {errors.volunteerType && (
          <p role="alert" className="text-xs text-brand-error">
            {errors.volunteerType.message}
          </p>
        )}
      </div>

      {/* Bio */}
      <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 space-y-2">
        <label htmlFor="bio" className="font-heading font-semibold text-sm text-brand-text">
          About
        </label>
        <textarea
          id="bio"
          {...register('bio')}
          rows={3}
          disabled={mutation.isPending}
          placeholder="Tell us about yourself…"
          className={inputCls('bio')}
        />
        {errors.bio && (
          <p role="alert" className="text-xs text-brand-error">
            {errors.bio.message}
          </p>
        )}
      </div>

      {/* Skills */}
      <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 space-y-3">
        <label
          htmlFor="skills"
          className="font-heading font-semibold text-sm text-brand-text flex items-center gap-2"
        >
          <Tag className="w-4 h-4 text-brand-primary" /> Skills
        </label>
        <input
          id="skills"
          {...register('skills')}
          disabled={mutation.isPending}
          placeholder="e.g. Teaching, Design, Coding"
          className={inputCls('skills')}
        />
        {errors.skills && (
          <p role="alert" className="text-xs text-brand-error">
            {errors.skills.message}
          </p>
        )}
      </div>

      {/* Interests */}
      <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 space-y-3">
        <label
          htmlFor="interests"
          className="font-heading font-semibold text-sm text-brand-text flex items-center gap-2"
        >
          <Tag className="w-4 h-4 text-brand-primary" /> Interests
        </label>
        <input
          id="interests"
          {...register('interests')}
          disabled={mutation.isPending}
          placeholder="e.g. Environment, Education, Health"
          className={inputCls('interests')}
        />
        {errors.interests && (
          <p role="alert" className="text-xs text-brand-error">
            {errors.interests.message}
          </p>
        )}
      </div>

      {/* Education */}
      <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 space-y-2">
        <label
          htmlFor="education"
          className="font-heading font-semibold text-sm text-brand-text flex items-center gap-2"
        >
          <GraduationCap className="w-4 h-4 text-brand-primary" /> Education
        </label>
        <input
          id="education"
          {...register('education')}
          disabled={mutation.isPending}
          placeholder="e.g., B.Com, MBA, 12th Pass"
          className={inputCls('education')}
        />
        {errors.education && (
          <p role="alert" className="text-xs text-brand-error">
            {errors.education.message}
          </p>
        )}
      </div>

      {/* Availability */}
      <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 space-y-4">
        <h2 className="font-heading font-semibold text-sm text-brand-text">Availability</h2>

        <div className="space-y-2">
          <p className="text-xs text-brand-muted font-medium">Days</p>
          <Controller
            control={control}
            name="days"
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    aria-pressed={field.value.includes(day)}
                    onClick={() => {
                      const updated = field.value.includes(day)
                        ? field.value.filter((d: string) => d !== day)
                        : [...field.value, day];
                      field.onChange(updated);
                    }}
                    disabled={mutation.isPending}
                    className={`px-3 py-2.5 min-h-[44px] rounded-full text-sm font-medium border transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary
                      ${field.value.includes(day) ? 'bg-brand-primary text-white border-brand-primary' : 'border-brand-border text-brand-text hover:border-brand-primary'}`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            )}
          />
          {errors.days && (
            <p role="alert" className="text-xs text-brand-error">
              {errors.days.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs text-brand-muted font-medium">Time Slots</p>
          <Controller
            control={control}
            name="timeSlots"
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    aria-pressed={field.value.includes(slot)}
                    onClick={() => {
                      const updated = field.value.includes(slot)
                        ? field.value.filter((s: string) => s !== slot)
                        : [...field.value, slot];
                      field.onChange(updated);
                    }}
                    disabled={mutation.isPending}
                    className={`px-3 py-2.5 min-h-[44px] rounded-full text-sm font-medium border transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary
                      ${field.value.includes(slot) ? 'bg-brand-primary text-white border-brand-primary' : 'border-brand-border text-brand-text hover:border-brand-primary'}`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          />
          {errors.timeSlots && (
            <p role="alert" className="text-xs text-brand-error">
              {errors.timeSlots.message}
            </p>
          )}
        </div>
      </div>

      {/* Save/Cancel at bottom */}
      <div className="flex gap-3 pt-2">
        <Button
          variant="outline"
          fullWidth
          onClick={() => {
            if (dirty) {
              const confirmed = window.confirm(
                'You have unsaved changes. Are you sure you want to cancel?'
              );
              if (!confirmed) return;
            }
            cancelEdit();
          }}
        >
          <X className="w-4 h-4" /> Cancel
        </Button>
        <Button variant="primary" fullWidth onClick={save} loading={mutation.isPending}>
          <Check className="w-4 h-4" /> Save Changes
        </Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl space-y-5">
      {/* Header card */}
      <div className="bg-brand-surface rounded-2xl border border-brand-border overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-brand-primary to-brand-secondary" />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-brand-primary border-4 border-brand-surface flex items-center justify-center shadow-md">
              <span className="text-white font-heading font-bold text-2xl">{initials}</span>
            </div>
            {!editing && (
              <button
                type="button"
                onClick={startEdit}
                className="flex items-center gap-1.5 text-sm font-medium text-brand-primary hover:bg-brand-bg px-3 py-2.5 min-h-[44px] rounded-lg transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
            )}
          </div>
          <h1 className="font-heading font-bold text-xl text-brand-text">{user?.name}</h1>
          <div className="flex items-center gap-1.5 mt-1 text-brand-muted text-sm">
            <Mail className="w-3.5 h-3.5" />
            <span>{user?.email}</span>
          </div>
          <div className="flex gap-2 mt-2">
            <span className="inline-block text-xs font-semibold bg-brand-primary/10 text-brand-primary px-2.5 py-0.5 rounded-full">
              Volunteer
            </span>
            {user?.volunteerType && (
              <span className="inline-block text-xs font-semibold bg-brand-cta/10 text-brand-cta px-2.5 py-0.5 rounded-full">
                {user.volunteerType.charAt(0) + user.volunteerType.slice(1).toLowerCase()}
              </span>
            )}
          </div>
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
            className="bg-brand-surface rounded-xl border border-brand-border p-4 text-center"
          >
            <Icon className="w-4 h-4 text-brand-primary mx-auto mb-1.5" />
            <p className="font-heading font-bold text-lg text-brand-text">{value}</p>
            <p className="text-xs text-brand-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Profile Completion Status */}
      {!editing && <ProfileCompletionInline />}

      {/* Current Level */}
      {levelData?.data && !editing && (
        <Link
          href="/volunteer/levels"
          className="block bg-brand-surface rounded-2xl border border-brand-border p-5 hover:border-brand-primary/30 transition-all duration-200 group card-hover"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LevelBadge
                tier={levelData.data.tier}
                name={
                  ['Onboarded', 'Mobilizer', 'Problem Solver', 'Leadership'][
                    levelData.data.tier - 1
                  ] ?? 'Onboarded'
                }
                badgeIcon={
                  ['Sprout', 'Users', 'Wrench', 'Crown'][levelData.data.tier - 1] ?? 'Sprout'
                }
                color={
                  [
                    'from-green-400 to-emerald-600',
                    'from-blue-400 to-indigo-600',
                    'from-purple-400 to-violet-600',
                    'from-amber-400 to-orange-600',
                  ][levelData.data.tier - 1] ?? 'from-green-400 to-emerald-600'
                }
                badgeShape={
                  ['circle', 'hexagon', 'shield', 'star'][levelData.data.tier - 1] as
                    | 'circle'
                    | 'hexagon'
                    | 'shield'
                    | 'star'
                }
                size="md"
              />
              <div>
                <p className="text-xs text-brand-muted">Current Level</p>
                <p className="font-heading font-semibold text-brand-text">
                  {['Onboarded', 'Mobilizer', 'Problem Solver', 'Leadership'][
                    levelData.data.tier - 1
                  ] ?? 'Onboarded'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-brand-muted">Points</p>
                <p className="font-heading font-bold text-brand-text">{levelData.data.points}</p>
              </div>
              <StreakBadge streak={levelData.data.streak} size="md" />
              <ArrowRight
                className="w-4 h-4 text-brand-muted group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all"
                aria-hidden="true"
              />
            </div>
          </div>
        </Link>
      )}

      {/* Pending Badges */}
      {pendingBadges?.filter((b: { pending: boolean }) => b.pending).length > 0 && !editing && (
        <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 space-y-3">
          <h2 className="font-heading font-semibold text-sm text-brand-text">Pending Badges</h2>
          <p className="text-xs text-brand-muted">
            These badges have been requested and are awaiting approval.
          </p>
          <div className="flex flex-wrap gap-2">
            {pendingBadges
              .filter((b: { pending: boolean }) => b.pending)
              .map(
                (badge: { name: string; title: string; description: string; imageUrl: string }) => (
                  <div
                    key={badge.name}
                    className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-3 py-1.5 rounded-full text-sm"
                  >
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {badge.title}
                  </div>
                )
              )}
          </div>
        </div>
      )}

      {/* Edit mode: all edit fields */}
      {editing ? (
        editorContent
      ) : (
        <>
          {/* Bio (view mode) */}
          <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 space-y-2">
            <h2 className="font-heading font-semibold text-sm text-brand-text">About</h2>
            <p className="text-sm text-brand-muted">{user?.profile?.bio || 'No bio added yet.'}</p>
          </div>

          {/* Skills (view mode) */}
          <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 space-y-3">
            <h2 className="font-heading font-semibold text-sm text-brand-text flex items-center gap-2">
              <Tag className="w-4 h-4 text-brand-primary" /> Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {(user?.profile?.skills ?? []).length > 0 ? (
                user.profile.skills.map((s: string) => (
                  <span
                    key={s}
                    className="text-xs font-medium bg-brand-primary/10 text-brand-primary border border-brand-primary/20 px-2.5 py-1 rounded-full"
                  >
                    {s}
                  </span>
                ))
              ) : (
                <p className="text-sm text-brand-muted">No skills added yet.</p>
              )}
            </div>
          </div>

          {/* Interests (view mode) */}
          <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 space-y-3">
            <h2 className="font-heading font-semibold text-sm text-brand-text flex items-center gap-2">
              <Tag className="w-4 h-4 text-brand-primary" /> Interests
            </h2>
            <div className="flex flex-wrap gap-2">
              {(user?.profile?.interests ?? []).length > 0 ? (
                user.profile.interests.map((s: string) => (
                  <span
                    key={s}
                    className="text-xs font-medium bg-brand-cta/10 text-brand-cta border border-brand-cta/20 px-2.5 py-1 rounded-full"
                  >
                    {s}
                  </span>
                ))
              ) : (
                <p className="text-sm text-brand-muted">No interests added yet.</p>
              )}
            </div>
          </div>

          {/* Education (view mode) */}
          <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 space-y-2">
            <h2 className="font-heading font-semibold text-sm text-brand-text flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-brand-primary" /> Education
            </h2>
            <p className="text-sm text-brand-muted">
              {user?.profile?.education || <span className="text-brand-muted">Not specified</span>}
            </p>
          </div>

          {/* Availability (view mode) */}
          <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 space-y-3">
            <h2 className="font-heading font-semibold text-sm text-brand-text">Availability</h2>
            {user?.profile?.availability ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {(user.profile.availability.days ?? []).map((d: string) => (
                    <span
                      key={d}
                      className="text-xs bg-brand-bg border border-brand-border px-2 py-0.5 rounded-full text-brand-text"
                    >
                      {d}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(user.profile.availability.timeSlots ?? []).map((s: string) => (
                    <span
                      key={s}
                      className="text-xs bg-brand-bg border border-brand-border px-2 py-0.5 rounded-full text-brand-text"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-brand-muted">No availability set.</p>
            )}
          </div>
        </>
      )}

      {/* Settings (always visible) */}
      <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 space-y-3">
        <h2 className="font-heading font-semibold text-sm text-brand-text flex items-center gap-2">
          <Settings className="w-4 h-4 text-brand-muted" /> Settings
        </h2>
        <div className="space-y-2">
          <Link
            href="/volunteer/settings/notifications"
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-brand-bg transition-colors cursor-pointer card-hover"
          >
            <Bell className="w-4 h-4 text-brand-muted" />
            <div>
              <p className="text-sm font-medium text-brand-text">Notification Preferences</p>
              <p className="text-xs text-brand-muted">Manage email and push notification types</p>
            </div>
          </Link>
          <Link
            href="/volunteer/settings/alerts"
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-brand-bg transition-colors cursor-pointer card-hover"
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

function ProfileCompletionInline() {
  const { profileStatus } = useAuth();

  if (!profileStatus || profileStatus.isComplete) return null;

  const { completionPercentage, missingFields } = profileStatus;

  const fieldLabels: Record<string, string> = {
    skills: 'Skills',
    interests: 'Interests',
    volunteerType: 'Volunteer Type',
    availability: 'Availability',
  };

  return (
    <div className="bg-brand-surface rounded-2xl border border-brand-border overflow-hidden">
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-semibold text-sm text-brand-text">Profile Completion</h2>
          <span className="text-xs font-medium text-brand-muted">{completionPercentage}%</span>
        </div>

        <div
          className="w-full h-2 rounded-full bg-brand-border overflow-hidden"
          role="progressbar"
          aria-valuenow={completionPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-brand-primary transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>

        {missingFields.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-brand-muted font-medium">Missing fields:</p>
            <div className="flex flex-wrap gap-1.5">
              {missingFields.map((f) => (
                <span
                  key={f}
                  className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full"
                >
                  {fieldLabels[f] ?? f}
                </span>
              ))}
            </div>
          </div>
        )}

        <Link
          href="/setup-profile"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-primary hover:underline"
        >
          Complete Profile →
        </Link>
      </div>
    </div>
  );
}
