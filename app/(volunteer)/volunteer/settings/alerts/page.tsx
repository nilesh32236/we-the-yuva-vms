'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BellRing, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { SkeletonCard } from '../../../../../components/shared/SkeletonCard';
import { Button } from '../../../../../components/ui/Button';
import { useToast } from '../../../../../hooks/use-toast';
import { api } from '../../../../../lib/api';

const CATEGORIES = [
  'EDUCATION',
  'HEALTH',
  'ENVIRONMENT',
  'COMMUNITY',
  'ARTS',
  'SPORTS',
  'TECHNOLOGY',
  'OTHER',
];

export default function AlertSubscriptionsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);

  const { data: subs, isLoading } = useQuery({
    queryKey: ['alert-subscriptions'],
    queryFn: () => api.get('/alerts').then((r) => r.data),
    staleTime: 30_000,
  });

  const createMut = useMutation({
    mutationFn: (data: { categories: string[]; skills: string[] }) => api.post('/alerts', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alert-subscriptions'] });
      toast({ title: 'Alert created' });
      setShowForm(false);
      setSelectedCats([]);
      setSkills([]);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/alerts/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alert-subscriptions'] });
      toast({ title: 'Alert removed' });
    },
  });

  const toggleCat = (cat: string) => {
    setSelectedCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  return (
    <div className="max-w-2xl space-y-5">
      <Link
        href="/volunteer/profile"
        className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-text transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="bg-brand-surface rounded-2xl border border-brand-border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BellRing className="w-5 h-5 text-brand-primary" />
            <h1 className="font-heading font-bold text-xl text-brand-text">Opportunity Alerts</h1>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-brand-primary hover:underline cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : showForm ? (
          <div className="border border-brand-border rounded-xl p-4 space-y-4">
            <p className="text-sm font-medium text-brand-text">New Alert Subscription</p>
            <div className="space-y-1.5">
              <label htmlFor="alert-categories" className="text-xs text-brand-muted">
                Categories
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => toggleCat(cat)}
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors cursor-pointer
                      ${selectedCats.includes(cat) ? 'bg-brand-primary text-white border-brand-primary' : 'bg-brand-surface text-brand-muted border-brand-border hover:border-brand-primary'}`}
                  >
                    {cat.charAt(0) + cat.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="alert-skill-input" className="text-xs text-brand-muted">
                Skills (optional)
              </label>
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {skills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 bg-brand-bg border border-brand-border text-xs px-2 py-0.5 rounded-full"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => setSkills((prev) => prev.filter((x) => x !== s))}
                      className="cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  id="alert-skill-input"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ',') && skillInput.trim()) {
                      e.preventDefault();
                      setSkills((prev) => [...prev, skillInput.trim()]);
                      setSkillInput('');
                    }
                  }}
                  placeholder="Add skill..."
                  className="flex-1 px-3 py-2 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="primary"
                onClick={() => createMut.mutate({ categories: selectedCats, skills })}
                loading={createMut.isPending}
              >
                Save Alert
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : subs?.length === 0 ? (
          <div className="text-center py-8 text-sm text-brand-muted">
            <p>No alert subscriptions yet</p>
            <p className="mt-1">Get notified when new opportunities match your interests</p>
          </div>
        ) : (
          <div className="space-y-2">
            {subs?.map(
              (s: { id: string; categories: string[]; skills: string[]; isActive: boolean }) => (
                <div
                  key={s.id}
                  className="border border-brand-border rounded-xl p-4 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    {s.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {s.categories.map((c) => (
                          <span
                            key={c}
                            className="text-xs bg-brand-bg px-2 py-0.5 rounded-full text-brand-muted"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                    {s.skills.length > 0 && (
                      <p className="text-xs text-brand-muted">Skills: {s.skills.join(', ')}</p>
                    )}
                    {s.categories.length === 0 && s.skills.length === 0 && (
                      <p className="text-xs text-brand-muted">All opportunities</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteMut.mutate(s.id)}
                    className="text-xs text-red-500 hover:underline shrink-0 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
