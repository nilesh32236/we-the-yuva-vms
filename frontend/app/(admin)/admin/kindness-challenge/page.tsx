'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/use-toast';
import { api, downloadCsv } from '@/lib/api';

interface Row {
  id: string;
  status: string;
  startDate: string;
  storyId: string | null;
  part2UnlockedAt: string | null;
  checkIns: { day: number }[];
  dailyPosts?: number;
  lastPostDay?: number | null;
  user: {
    name: string;
    email: string | null;
    phone: string | null;
    whatsappNumber: string | null;
    referralSource: string | null;
    createdAt: string;
    part2?: { volunteerRoleTier: string | null; lifeSkills: string[]; completedAt: string | null } | null;
  };
}

export default function AdminKindnessPage() {
  const [status, setStatus] = useState('');
  const [source, setSource] = useState('');
  const { toast } = useToast();

  const qs = new URLSearchParams();
  if (status) qs.set('status', status);
  if (source) qs.set('source', source);

  const { data, isLoading } = useQuery<Row[]>({
    queryKey: ['admin-kindness', status, source],
    queryFn: async () => (await api.get(`/kindness-challenge/admin?${qs.toString()}`)).data,
  });

  const exportCsv = async () => {
    try {
      await downloadCsv(`/kindness-challenge/admin/export?${qs.toString()}`, 'kindness-challenges.csv');
    } catch {
      toast({ title: 'Error', description: 'Failed to export CSV', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-xl font-bold text-brand-text">Kindness Challenge Tracker</h1>
        <div className="flex gap-2">
          <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-brand-border bg-background px-3 py-2 text-sm min-h-11">
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
          </select>
          <select aria-label="Filter by referral source" value={source} onChange={(e) => setSource(e.target.value)} className="rounded-lg border border-brand-border bg-background px-3 py-2 text-sm min-h-11">
            <option value="">All sources</option>
            {['FRIEND', 'COLLEGE', 'PARTNER_ORG', 'SOCIAL_MEDIA', 'WEBSITE', 'CURRENT_VOLUNTEER', 'NEWSPAPER', 'EVENT', 'OTHER'].map((s) => (
              <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>
            ))}
          </select>
          <Button variant="outline" onClick={exportCsv}>Export CSV</Button>
        </div>
      </div>

      {isLoading ? (
        <SkeletonCard />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-brand-border">
          <table className="w-full text-sm">
            <thead className="bg-brand-surface text-left text-brand-muted">
              <tr>
                {['Registrant', 'WhatsApp', 'Registered', 'Source', 'Status', 'Check-ins', 'Story', 'Part II Unlock', 'Part II Done', 'Role Tier', 'Daily Posts'].map((h) => (
                  <th key={h} className="px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((r) => (
                <tr key={r.id} className="border-t border-brand-border">
                  <td className="px-4 py-3">{r.user.name}<br /><span className="text-xs text-brand-muted">{r.user.email}</span></td>
                  <td className="px-4 py-3">{r.user.whatsappNumber ?? r.user.phone ?? '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{new Date(r.user.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3">{r.user.referralSource?.replaceAll('_', ' ') ?? '—'}</td>
                  <td className="px-4 py-3">{r.status}</td>
                  <td className="px-4 py-3">
                    <span className="tabular-nums">{r.checkIns.length}/7</span>{' '}
                    <span className="tracking-tighter">{Array.from({ length: 7 }, (_, i) => r.checkIns.some((c) => c.day === i + 1) ? '●' : '○').join('')}</span>
                  </td>
                  <td className="px-4 py-3">{r.storyId ? '✓' : '✗'}</td>
                  <td className="px-4 py-3">{r.part2UnlockedAt ? 'unlocked' : 'locked'}</td>
                  <td className="px-4 py-3">{r.user.part2?.completedAt ? 'yes' : '—'}</td>
                  <td className="px-4 py-3">{r.user.part2?.volunteerRoleTier?.replaceAll('_', ' ') ?? '—'}</td>
                  <td className="px-4 py-3 tabular-nums">{r.dailyPosts ?? 0}{r.lastPostDay ? ` (d${r.lastPostDay})` : ''}</td>
                </tr>
              ))}
              {data?.length === 0 && (
                <tr><td colSpan={11} className="px-4 py-8 text-center text-brand-muted">No challenges found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
