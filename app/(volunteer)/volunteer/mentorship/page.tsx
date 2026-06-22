'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle,
  Handshake,
  Loader2,
  MessageSquare,
  UserPlus,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { haptic } from '@/lib/haptic';
import { useAuth } from '@/hooks/useAuth';

interface MentorshipRelation {
  id: string;
  mentor: { id: string; name: string };
  mentee: { id: string; name: string };
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED';
  createdAt: string;
  message?: string;
}

const TABS = [
  { key: 'mentors', label: 'My Mentors' },
  { key: 'mentees', label: 'My Mentees' },
  { key: 'requests', label: 'Requests' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  ACTIVE: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  COMPLETED: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
};

function AvatarInitials({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
      <span className="text-sm font-bold text-brand-primary">{initials}</span>
    </div>
  );
}

function MentorshipCard({
  relation,
  type,
}: {
  relation: MentorshipRelation;
  type: 'mentor' | 'mentee' | 'pending-to' | 'pending-from';
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const name = type === 'mentor' ? relation.mentor.name : relation.mentee.name;

  const reviewMutation = useMutation({
    mutationFn: (status: 'ACTIVE' | 'COMPLETED') =>
      api.patch(`/mentorship/${relation.id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mentorship'] });
      toast({ title: 'Request updated' });
      haptic.success();
    },
    onError: (e: { response?: { data?: { error?: string } } }) =>
      toast({
        title: 'Failed',
        description: e?.response?.data?.error ?? 'Something went wrong',
        variant: 'destructive',
      }),
  });

  const completeMutation = useMutation({
    mutationFn: () => api.patch(`/mentorship/${relation.id}/complete`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mentorship'] });
      toast({ title: 'Mentorship completed!' });
      haptic.success();
    },
    onError: (e: { response?: { data?: { error?: string } } }) =>
      toast({
        title: 'Failed',
        description: e?.response?.data?.error ?? 'Something went wrong',
        variant: 'destructive',
      }),
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.delete(`/mentorship/${relation.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mentorship'] });
      toast({ title: 'Request cancelled' });
      haptic.light();
    },
    onError: (e: { response?: { data?: { error?: string } } }) =>
      toast({
        title: 'Failed',
        description: e?.response?.data?.error ?? 'Something went wrong',
        variant: 'destructive',
      }),
  });

  return (
    <div className="bg-brand-surface rounded-2xl border border-brand-border p-4 flex items-center gap-3">
      <AvatarInitials name={name} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-brand-text truncate">{name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[relation.status] ?? ''}`}
          >
            {relation.status}
          </span>
          <span className="text-[10px] text-brand-muted">
            {new Date(relation.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>
        {relation.message && (
          <p className="text-xs text-brand-muted mt-1.5 italic truncate">
            &ldquo;{relation.message}&rdquo;
          </p>
        )}
      </div>
      <div className="flex gap-1.5 flex-shrink-0">
        {type === 'pending-from' && relation.status === 'PENDING' && (
          <>
            <Button
              variant="primary"
              size="sm"
              onClick={() => reviewMutation.mutate('ACTIVE')}
              disabled={reviewMutation.isPending}
            >
              <CheckCircle className="w-3.5 h-3.5" /> Accept
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => reviewMutation.mutate('COMPLETED')}
              disabled={reviewMutation.isPending}
            >
              <XCircle className="w-3.5 h-3.5" /> Decline
            </Button>
          </>
        )}
        {type === 'mentee' && relation.status === 'ACTIVE' && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => completeMutation.mutate()}
            disabled={completeMutation.isPending}
          >
            Mark Complete
          </Button>
        )}
        {type === 'pending-to' && relation.status === 'PENDING' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
          >
            <XCircle className="w-3.5 h-3.5" /> Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

function RequestMentorForm({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [menteeId, setMenteeId] = useState('');
  const [message, setMessage] = useState('');

  const requestMutation = useMutation({
    mutationFn: () =>
      api.post('/mentorship', {
        menteeId,
        ...(message.trim() ? { message: message.trim() } : {}),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mentorship'] });
      toast({ title: 'Request sent!' });
      haptic.success();
      setMenteeId('');
      setMessage('');
      onClose();
    },
    onError: (e: { response?: { data?: { error?: string } } }) =>
      toast({
        title: 'Failed',
        description: e?.response?.data?.error ?? 'Something went wrong',
        variant: 'destructive',
      }),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-brand-surface rounded-2xl border border-brand-border p-6 w-full max-w-md space-y-4">
        <h2 className="font-heading font-semibold text-lg text-brand-text">Request Mentor</h2>

        <div>
          <label className="text-xs font-medium text-brand-muted mb-1.5 block">
            Mentor Email or Name
          </label>
          <input
            type="text"
            value={menteeId}
            onChange={(e) => setMenteeId(e.target.value)}
            placeholder="Enter mentor email or name"
            className="w-full px-3 py-2.5 rounded-xl bg-brand-bg border border-brand-border text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-brand-muted mb-1.5 block">
            Message <span className="text-brand-muted">(optional)</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Why do you want this mentor?"
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl bg-brand-bg border border-brand-border text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/40 resize-none"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => requestMutation.mutate()}
            disabled={!menteeId.trim() || requestMutation.isPending}
            loading={requestMutation.isPending}
            className="flex-1"
          >
            Send Request
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function MentorshipPage() {
  useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('mentors');
  const [showForm, setShowForm] = useState(false);

  const { data: mentors = [], isLoading: mentorsLoading } = useQuery<MentorshipRelation[]>({
    queryKey: ['mentorship', 'mentors'],
    queryFn: () => api.get('/mentorship/mentors').then((r) => r.data?.data ?? r.data ?? []),
  });

  const { data: mentees = [], isLoading: menteesLoading } = useQuery<MentorshipRelation[]>({
    queryKey: ['mentorship', 'mentees'],
    queryFn: () => api.get('/mentorship/mentees').then((r) => r.data?.data ?? r.data ?? []),
  });

  const { data: pendingFrom = [], isLoading: pendingFromLoading } = useQuery<MentorshipRelation[]>({
    queryKey: ['mentorship', 'pending'],
    queryFn: () => api.get('/mentorship/pending').then((r) => r.data?.data ?? r.data ?? []),
  });

  const { data: pendingTo = [], isLoading: pendingToLoading } = useQuery<MentorshipRelation[]>({
    queryKey: ['mentorship', 'requests'],
    queryFn: () => api.get('/mentorship/requests').then((r) => r.data?.data ?? r.data ?? []),
  });

  const isLoading =
    mentorsLoading || menteesLoading || pendingFromLoading || pendingToLoading;

  function renderTab() {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      );
    }

    if (activeTab === 'mentors') {
      if (mentors.length === 0) {
        return (
          <div className="text-center py-12 bg-brand-surface rounded-2xl border border-brand-border">
            <Handshake className="w-10 h-10 mx-auto mb-3 text-brand-muted opacity-50" />
            <p className="text-sm font-medium text-brand-text">No mentors yet</p>
            <p className="text-xs text-brand-muted mt-1">
              Request a mentor to get started.
            </p>
          </div>
        );
      }
      return (
        <div className="space-y-3">
          {mentors.map((r) => (
            <MentorshipCard key={r.id} relation={r} type="mentor" />
          ))}
        </div>
      );
    }

    if (activeTab === 'mentees') {
      if (mentees.length === 0) {
        return (
          <div className="text-center py-12 bg-brand-surface rounded-2xl border border-brand-border">
            <Handshake className="w-10 h-10 mx-auto mb-3 text-brand-muted opacity-50" />
            <p className="text-sm font-medium text-brand-text">No mentees yet</p>
            <p className="text-xs text-brand-muted mt-1">
              When volunteers request you as a mentor, they will appear here.
            </p>
          </div>
        );
      }
      return (
        <div className="space-y-3">
          {mentees.map((r) => (
            <MentorshipCard key={r.id} relation={r} type="mentee" />
          ))}
        </div>
      );
    }

    // Requests tab
    const allRequests = [
      ...pendingFrom.map((r) => ({ ...r, _type: 'pending-from' as const })),
      ...pendingTo.map((r) => ({ ...r, _type: 'pending-to' as const })),
    ];

    if (allRequests.length === 0) {
      return (
        <div className="text-center py-12 bg-brand-surface rounded-2xl border border-brand-border">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 text-brand-muted opacity-50" />
          <p className="text-sm font-medium text-brand-text">No requests</p>
          <p className="text-xs text-brand-muted mt-1">
            You have no pending mentorship requests.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {allRequests.map((r) => (
          <MentorshipCard key={r.id} relation={r} type={r._type} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-xl text-brand-text">Mentorship</h1>
          <p className="text-brand-muted text-sm mt-1">
            Connect with mentors and guide fellow volunteers.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            haptic.medium();
            setShowForm(true);
          }}
        >
          <UserPlus className="w-4 h-4" /> Request Mentor
        </Button>
      </div>

      <div className="flex gap-1 bg-brand-surface rounded-xl p-1 border border-brand-border">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              haptic.light();
              setActiveTab(tab.key);
            }}
            className={`flex-1 text-sm font-medium py-2 rounded-lg transition-colors cursor-pointer ${
              activeTab === tab.key
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-brand-muted hover:text-brand-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {renderTab()}

      <RequestMentorForm open={showForm} onClose={() => setShowForm(false)} />
    </div>
  );
}
