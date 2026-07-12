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
import { DAYS, TIME_SLOTS } from '@/lib/shared';
import { Button } from '../../../../components/ui/Button';
import { useToast } from '../../../../hooks/use-toast';
import { LevelBadge } from '../../../../components/levels/LevelBadge';
import { StreakBadge } from '../../../../components/levels/StreakBadge';
import { useAuth } from '../../../../hooks/useAuth';
import { api } from '../../../../lib/api';
import { haptic } from '@/lib/haptic';

export default function VolunteerProfilePage() {
  const { user: _authUser } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [volunteerType, setVolunteerType] = useState('');
  const [skills, setSkills] = useState('');
  const [interests, setInterests] = useState('');
  const [education, setEducation] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const cancelRef = useRef(false);

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
      setFieldErrors({});
      toast({ title: 'Profile updated successfully' });
    },
    onError: (err: {
      response?: {
        data?: { error?: string; details?: { fieldErrors?: Record<string, string[]> } };
      };
    }) => {
      const details = err?.response?.data?.details;
      if (details?.fieldErrors) {
        const flat: Record<string, string> = {};
        for (const [key, msgs] of Object.entries(details.fieldErrors)) {
          if (msgs.length > 0) flat[key] = msgs[0];
        }
        setFieldErrors(flat);
      }
      toast({
        title: 'Error',
        description: err?.response?.data?.error || 'Failed to update profile',
        variant: 'destructive',
      });
    },
  });

  function startEdit() {
    setBio(user?.profile?.bio ?? '');
    setVolunteerType(user?.volunteerType ?? '');
    setSkills((user?.profile?.skills ?? []).join(', '));
    setInterests((user?.profile?.interests ?? []).join(', '));
    setEducation(user?.profile?.education ?? '');
    const avail = user?.profile?.availability;
    setSelectedDays(avail?.days ?? []);
    setSelectedSlots(avail?.timeSlots ?? []);
    setFieldErrors({});
    setDirty(false);
    cancelRef.current = false;
    setEditing(true);
  }

  const cancelEdit = useCallback(function cancelEdit() {
    setEditing(false);
    setFieldErrors({});
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

  function save() {
    haptic.medium();
    const errs: Record<string, string> = {};
    if (!volunteerType) errs.volunteerType = 'Please select a volunteer type';
    if (selectedDays.length === 0) errs.days = 'Please select at least one day';
    if (selectedSlots.length === 0) errs.timeSlots = 'Please select at least one time slot';
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    mutation.mutate({
      volunteerType,
      bio,
      skills: skills
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean),
      interests: interests
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean),
      education: education || undefined,
      availability: { days: selectedDays, timeSlots: selectedSlots },
    });
  }

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

  const toggleDay = (day: string) =>
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );

  const toggleSlot = (slot: string) =>
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );

  const initials =
    user?.name
      ?.split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ?? '?';

  const inputCls = (field: string) =>
    `w-full text-sm border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 transition-colors bg-background ${
      fieldErrors[field]
        ? 'border-brand-error focus:ring-brand-error/30 bg-brand-error/5'
        : 'border-brand-border focus:ring-brand-primary/30'
    }`;

  const selectCls = (field: string) =>
    `w-full text-sm border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 transition-colors bg-background ${
      fieldErrors[field]
        ? 'border-brand-error focus:ring-brand-error/30 bg-brand-error/5'
        : 'border-brand-border focus:ring-brand-primary/30'
    }`;

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-40 text-brand-muted text-sm">Loading…</div>
    );

  const editorContent = (
    <div data-profile-editor>
      {/* Volunteer Type */}
      <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 space-y-3">
        <h2 className="font-heading font-semibold text-sm text-brand-text">Volunteer Type</h2>
        <select
          value={volunteerType}
          onChange={(e) => setVolunteerType(e.target.value)}
          className={selectCls('volunteerType')}
        >
          <option value="">Select Type</option>
          {['STUDENT', 'PROFESSIONAL', 'EVENT', 'RECURRING', 'REMOTE', 'EMERGENCY'].map((t) => (
            <option key={t} value={t}>
              {t.charAt(0) + t.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
        {fieldErrors.volunteerType && (
          <p className="text-xs text-brand-error">{fieldErrors.volunteerType}</p>
        )}
      </div>

      {/* Bio */}
      <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 space-y-2">
        <h2 className="font-heading font-semibold text-sm text-brand-text">About</h2>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          placeholder="Tell us about yourself…"
          className={inputCls('bio')}
        />
        {fieldErrors.bio && <p className="text-xs text-brand-error">{fieldErrors.bio}</p>}
      </div>

      {/* Skills */}
      <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 space-y-3">
        <h2 className="font-heading font-semibold text-sm text-brand-text flex items-center gap-2">
          <Tag className="w-4 h-4 text-brand-primary" /> Skills
        </h2>
        <input
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          placeholder="e.g. Teaching, Design, Coding"
          className={inputCls('skills')}
        />
        {fieldErrors.skills && <p className="text-xs text-brand-error">{fieldErrors.skills}</p>}
      </div>

      {/* Interests */}
      <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 space-y-3">
        <h2 className="font-heading font-semibold text-sm text-brand-text flex items-center gap-2">
          <Tag className="w-4 h-4 text-brand-cta" /> Interests
        </h2>
        <input
          value={interests}
          onChange={(e) => setInterests(e.target.value)}
          placeholder="e.g. Environment, Education, Health"
          className={inputCls('interests')}
        />
        {fieldErrors.interests && (
          <p className="text-xs text-brand-error">{fieldErrors.interests}</p>
        )}
      </div>

      {/* Education */}
      <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 space-y-2">
        <h2 className="font-heading font-semibold text-sm text-brand-text flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-brand-primary" /> Education
        </h2>
        <input
          value={education}
          onChange={(e) => setEducation(e.target.value)}
          placeholder="e.g., B.Com, MBA, 12th Pass"
          className={inputCls('education')}
        />
        {fieldErrors.education && (
          <p className="text-xs text-brand-error">{fieldErrors.education}</p>
        )}
      </div>

      {/* Availability */}
      <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 space-y-4">
        <h2 className="font-heading font-semibold text-sm text-brand-text">Availability</h2>

        <div className="space-y-2">
          <p className="text-xs text-brand-muted font-medium">Days</p>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors cursor-pointer
                  ${selectedDays.includes(day) ? 'bg-brand-primary text-white border-brand-primary' : 'border-brand-border text-brand-text hover:border-brand-primary'}`}
              >
                {day}
              </button>
            ))}
          </div>
          {fieldErrors.days && <p className="text-xs text-brand-error">{fieldErrors.days}</p>}
        </div>

        <div className="space-y-2">
          <p className="text-xs text-brand-muted font-medium">Time Slots</p>
          <div className="flex flex-wrap gap-2">
            {TIME_SLOTS.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => toggleSlot(slot)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors cursor-pointer
                  ${selectedSlots.includes(slot) ? 'bg-brand-primary text-white border-brand-primary' : 'border-brand-border text-brand-text hover:border-brand-primary'}`}
              >
                {slot}
              </button>
            ))}
          </div>
          {fieldErrors.timeSlots && (
            <p className="text-xs text-brand-error">{fieldErrors.timeSlots}</p>
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
                className="flex items-center gap-1.5 text-sm font-medium text-brand-primary hover:bg-brand-bg px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
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
              .map((badge: { name: string; title: string; description: string; imageUrl: string }) => (
                <div
                  key={badge.name}
                  className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-3 py-1.5 rounded-full text-sm"
                >
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {badge.title}
                </div>
              ))}
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
              <Tag className="w-4 h-4 text-brand-cta" /> Interests
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

      {/* Profile Completion Status Inline */}
      <ProfileCompletionInline />
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

        <div className="w-full h-2 rounded-full bg-brand-border overflow-hidden">
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
