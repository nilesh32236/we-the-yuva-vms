'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, CheckCircle2, Circle, Share2, Sprout } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { FileUpload } from '../../../../components/shared/FileUpload';
import { SkeletonCard } from '../../../../components/shared/SkeletonCard';
import { Button } from '../../../../components/ui/Button';
import { useToast } from '../../../../hooks/use-toast';
import { api } from '../../../../lib/api';
import { useMyChallenge, useKindnessPosts } from '../../../../lib/kindness';

const ACTS = [
  'Help someone without being asked',
  'Listen patiently to someone who needs to talk',
  'Help someone learn a new skill',
  'Appreciate or encourage someone',
  'Help an elderly person with a task',
  'Share useful knowledge, resources, or information',
  'Help someone struggling with technology',
  'Include someone who feels left out',
  'Help keep my neighborhood or public space clean',
  'Support someone in completing an important task',
  'Volunteer my time for a community activity',
];

const inputCls =
  'w-full px-4 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary border-brand-border';

export default function KindnessChallengePage() {
  const { data, isLoading } = useMyChallenge();
  const enrolled = Boolean(data && 'challenge' in data);
  const { data: posts } = useKindnessPosts(enrolled);
  const qc = useQueryClient();
  const router = useRouter();
  const { toast } = useToast();
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postMediaUrl, setPostMediaUrl] = useState('');
  const [postIsCompletion, setPostIsCompletion] = useState(false);

  // Start form
  const [acts, setActs] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  useEffect(() => {
    if (!startDate) setStartDate(new Date(Date.now() + 86_400_000).toISOString().slice(0, 10));
  }, [startDate]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['kindness-challenge'] });

  const closePostDialog = useCallback(() => {
    setShowPostDialog(false);
    setPostTitle('');
    setPostContent('');
    setPostMediaUrl('');
    setPostIsCompletion(false);
  }, []);

  useEffect(() => {
    if (!showPostDialog) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePostDialog();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showPostDialog, closePostDialog]);

  const start = useMutation({
    mutationFn: async () => {
      const r = await api.post('/kindness-challenge', { acts, startDate });
      return r.data;
    },
    onSuccess: () => {
      toast({ title: 'Challenge started!' });
      invalidate();
    },
    onError: (e) => toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' }),
  });

  const checkIn = useMutation({
    mutationFn: async () => (await api.post('/kindness-challenge/check-in')).data,
    onSuccess: () => {
      toast({ title: 'Checked in — see you tomorrow!' });
      invalidate();
    },
    onError: (e) => toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' }),
  });

  const linkRecent = useMutation({
    mutationFn: async () => {
      const mine = (await api.get('/stories', { params: { limit: 1 } })).data;
      const first = Array.isArray(mine) ? mine[0] : mine?.items?.[0] ?? mine?.stories?.[0];
      if (!first) throw new Error('No recent story found');
      return (await api.patch('/kindness-challenge/link-story', { storyId: first.id })).data;
    },
    onSuccess: () => {
      toast({ title: 'Story linked — Part II unlocked!' });
      invalidate();
    },
    onError: (e) => toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' }),
  });

  const postWork = useMutation({
    mutationFn: async (vars: { isCompletion: boolean }) => {
      if (!data || !('challenge' in data)) throw new Error('No challenge');
      const ch = (data as { challenge: { id: string } }).challenge;
      const r = await api.post('/stories', {
        title: postTitle.trim(),
        content: postContent.trim(),
        mediaUrl: postMediaUrl || undefined,
        kindnessChallengeId: ch.id,
        isCompletion: vars.isCompletion,
      });
      return r.data;
    },
    onSuccess: (_res, vars) => {
      toast({ title: vars.isCompletion ? 'Challenge completed — Part II unlocked!' : 'Kindness work posted!' });
      closePostDialog();
      qc.invalidateQueries({ queryKey: ['kindness-challenge', 'me'] });
      qc.invalidateQueries({ queryKey: ['kindness-challenge', 'me', 'posts'] });
    },
    onError: (e) => toast({ title: 'Error', description: (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? (e as Error).message, variant: 'destructive' }),
  });

  if (isLoading) return <SkeletonCard />;
  if (!data) return <NotStarted acts={acts} setActs={setActs} startDate={startDate} setStartDate={setStartDate} onStart={() => start.mutate()} busy={start.isPending} />;

  const { challenge, view } = data;
  const handleWaShare = () => {
    const origin = window.location.origin;
    const shareUrl = `${origin}/volunteer/stories/new?challenge=${challenge.id}`;
    const shareText = encodeURIComponent(
      `I just completed the 7-Day Kindness Challenge with WeTheYuva! Read my story: ${shareUrl}`
    );
    window.open(`https://wa.me/?text=${shareText}`, '_blank');
  };

  if (challenge.status === 'COMPLETED') {
    return (
      <div className="max-w-xl mx-auto space-y-4 text-center py-10">
        <CheckCircle2 className="w-16 h-16 text-brand-primary mx-auto" />
        <h1 className="font-heading text-2xl font-bold text-brand-text">Challenge Complete!</h1>
        <p className="text-brand-muted">You checked in {view.checkedInDays.length}/7 days and shared your story.</p>
        <Link href="/volunteer/part2" className="inline-block"><Button variant="cta">See what's next — Part II</Button></Link>
      </div>
    );
  }

  if (view.canShareStory) {
    return (
      <div className="max-w-xl mx-auto space-y-4 py-10 text-center">
        <Sprout className="w-16 h-16 text-brand-primary mx-auto" />
        <h1 className="font-heading text-2xl font-bold text-brand-text">Your 7 days are complete!</h1>
        <p className="text-brand-muted text-sm">
          Reflection prompt: “What changed in me or in the other person because of this small act of kindness?”
        </p>
        <Button variant="cta" fullWidth onClick={handleWaShare}>
          <Share2 className="w-4 h-4" /> Share Your Story via WhatsApp
        </Button>
        <Button variant="outline" fullWidth onClick={() => router.push(`/volunteer/stories/new?challenge=${challenge.id}`)}>
          Or write it in-app
        </Button>
        <Button variant="ghost" size="sm" onClick={() => linkRecent.mutate()} loading={linkRecent.isPending} className="text-brand-muted mt-2">
          I already posted my story — link it
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 py-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-brand-text">7-Day Kindness Challenge</h1>
        <p className="text-brand-muted text-sm">Day {Math.min(view.currentDay, 7)} of 7 · {view.daysRemaining} day{view.daysRemaining === 1 ? '' : 's'} to go</p>
      </div>

      <div className="flex justify-between gap-1">
        {Array.from({ length: 7 }, (_, i) => i + 1).map((d) => (
          <div key={d} className="flex flex-col items-center gap-1">
            {view.checkedInDays.includes(d) ? (
              <CheckCircle2 className="w-8 h-8 text-brand-primary" />
            ) : (
              <Circle className={`w-8 h-8 ${d === view.currentDay ? 'text-brand-accent animate-subtle-pulse' : 'text-brand-border'}`} />
            )}
            <span className="text-[10px] text-brand-muted">D{d}</span>
          </div>
        ))}
      </div>

      <Button variant="cta" fullWidth disabled={!view.canCheckInToday || checkIn.isPending} onClick={() => checkIn.mutate()}>
        {view.checkedInDays.includes(view.currentDay)
          ? 'Already checked in ✓'
          : view.canCheckInToday
            ? `Check in — Day ${view.currentDay}`
            : 'Check-in opens tomorrow'}
      </Button>

      <div className="rounded-2xl border border-brand-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-brand-text">My Kindness Work</p>
          <Button variant="outline" size="sm" onClick={() => setShowPostDialog(true)}>Post Update</Button>
        </div>
        {posts && posts.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {posts.map((post) => (
              <div key={post.id} className="rounded-lg border border-brand-border p-3 text-left">
                <div className="flex items-center gap-2 text-xs text-brand-muted">
                  <span className="rounded-full bg-brand-primary/10 text-brand-primary px-2 py-0.5">Day {post.kindnessDay ?? '?'}</span>
                  {post.isCompletion && <span className="rounded-full bg-brand-accent/20 text-brand-accent px-2 py-0.5">Completion</span>}
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="font-medium text-sm text-brand-text mt-1">{post.title}</p>
                <p className="text-xs text-brand-muted line-clamp-2">{post.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-brand-muted">No posts yet — share what you did today.</p>
        )}
        <div className="flex gap-1">
          {Array.from({ length: 7 }, (_, i) => i + 1).map((d) => {
            const hasPost = posts?.some((p) => p.kindnessDay === d);
            return <div key={d} className={`flex-1 h-2 rounded-full ${hasPost ? 'bg-brand-primary' : 'bg-brand-border'}`} title={`Day ${d}${hasPost ? ' ✓' : ''}`} />;
          })}
        </div>
      </div>

      {showPostDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) closePostDialog();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && e.target === e.currentTarget) closePostDialog();
          }}
        >
          <div className="bg-brand-surface rounded-2xl shadow-xl border border-brand-border w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <h2 className="font-heading font-semibold text-lg text-brand-text">Post Kindness Work</h2>
            <p className="text-xs text-brand-muted">Day {view.currentDay} · This will appear in your timeline. Check "Mark as completion" to unlock Part II.</p>
            <div className="space-y-1.5">
              <label htmlFor="postTitle" className="text-sm font-medium text-brand-text">Title *</label>
              <input id="postTitle" value={postTitle} onChange={(e) => setPostTitle(e.target.value)} placeholder="e.g. Helped a neighbor today" maxLength={80} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="postContent" className="text-sm font-medium text-brand-text">What did you do? * (20–1000)</label>
              <textarea id="postContent" value={postContent} onChange={(e) => setPostContent(e.target.value)} rows={4} maxLength={1000} placeholder="Describe the kindness work you did..." className={inputCls} />
              <p className="text-xs text-brand-muted text-right">{postContent.length}/1000</p>
            </div>
            <FileUpload onUpload={setPostMediaUrl} previewUrl={postMediaUrl || null} accept="image/*" label="Photo (optional)" />
            <label className={`flex items-center gap-2 rounded-lg border border-brand-border px-3 py-2.5 ${view.currentDay >= 7 ? 'cursor-pointer' : 'opacity-60'}`}>
              <input
                type="checkbox"
                checked={postIsCompletion}
                disabled={view.currentDay < 7}
                onChange={(e) => setPostIsCompletion(e.target.checked)}
                className="accent-brand-primary"
              />
              <span className="text-sm">
                Mark as completion (unlock Part II){view.currentDay < 7 ? ' — available from Day 7' : ''}
              </span>
            </label>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={closePostDialog}>Cancel</Button>
              <Button variant="cta" className="flex-1" loading={postWork.isPending} disabled={!postTitle.trim() || postContent.trim().length < 20 || postWork.isPending} onClick={() => postWork.mutate({ isCompletion: postIsCompletion })}>Post</Button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-brand-border p-4">
        <p className="text-sm font-medium text-brand-text mb-2">My chosen acts</p>
        <ul className="list-disc pl-5 text-sm text-brand-muted space-y-1">
          {challenge.acts.map((a) => <li key={a}>{a}</li>)}
        </ul>
      </div>
    </div>
  );
}

function NotStarted(props: {
  acts: string[];
  setActs: (a: string[]) => void;
  startDate: string;
  setStartDate: (s: string) => void;
  onStart: () => void;
  busy: boolean;
}) {
  const toggle = (act: string) =>
    props.setActs(props.acts.includes(act) ? props.acts.filter((a) => a !== act) : [...props.acts, act]);
  return (
    <div className="max-w-xl mx-auto space-y-4 py-6">
      <div className="flex items-center gap-3">
        <CalendarDays className="w-8 h-8 text-brand-primary" />
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-text">7-Day Kindness Challenge</h1>
          <p className="text-brand-muted text-sm">Small Acts • Real Impact • One Week</p>
        </div>
      </div>
      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium text-brand-text">Which acts are you willing to do? *</legend>
        {ACTS.map((act) => (
          <label key={act} className="flex items-start gap-2 rounded-lg border border-brand-border px-3 py-2 cursor-pointer">
            <input type="checkbox" checked={props.acts.includes(act)} onChange={() => toggle(act)} className="accent-brand-primary mt-0.5" />
            <span className="text-sm">{act}</span>
          </label>
        ))}
      </fieldset>
      <div className="space-y-1.5">
        <label htmlFor="start" className="text-sm font-medium text-brand-text">Date of Commencing *</label>
        <input id="start" type="date" className={inputCls} value={props.startDate} onChange={(e) => props.setStartDate(e.target.value)} />
      </div>
      <Button variant="cta" fullWidth loading={props.busy} disabled={props.busy} onClick={props.onStart}>
        Take the Challenge
      </Button>
    </div>
  );
}
