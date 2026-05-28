'use client';

import { Briefcase, Calendar, MapPin, Users, Wifi } from 'lucide-react';
import { memo, useState } from 'react';
import { useToast } from '../../hooks/use-toast';
import { api } from '../../lib/api';

const CATEGORY_COLORS: Record<string, string> = {
  EDUCATION: 'bg-blue-100 text-blue-700',
  HEALTH: 'bg-red-100 text-red-700',
  ENVIRONMENT: 'bg-green-100 text-green-700',
  COMMUNITY: 'bg-purple-100 text-purple-700',
  ARTS: 'bg-pink-100 text-pink-700',
  SPORTS: 'bg-orange-100 text-orange-700',
  TECHNOLOGY: 'bg-cyan-100 text-cyan-700',
  OTHER: 'bg-gray-100 text-gray-700',
};

interface OpportunityCardProps {
  opportunity: {
    id: string;
    title: string;
    category: string;
    isRemote: boolean;
    startDate: string;
    endDate: string;
    hoursPerSession: number;
    skills: string[];
    totalSlots: number;
    location?: { name: string; district: string } | null;
    _count?: { applications: number };
    matchScore?: number;
    userApplication?: { status: string } | null;
  };
  showApply?: boolean;
  onApplied?: (id: string) => void;
}

const OpportunityCard = memo(function OpportunityCard({
  opportunity: opp,
  showApply = false,
  onApplied,
}: OpportunityCardProps) {
  const { toast } = useToast();
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(!!opp.userApplication);

  const filled = opp._count?.applications ?? 0;
  const fillPct = Math.min((filled / opp.totalSlots) * 100, 100);
  const isFull = filled >= opp.totalSlots;

  const handleApply = async () => {
    setApplying(true);
    try {
      await api.post(`/opportunities/${opp.id}/apply`);
      setApplied(true);
      toast({ title: 'Application submitted!', description: `You applied to "${opp.title}"` });
      onApplied?.(opp.id);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        toast({
          title: 'Already applied',
          description: "You've already applied to this opportunity.",
          variant: 'destructive',
        });
        setApplied(true);
      } else {
        toast({
          title: 'Error',
          description: 'Could not submit application.',
          variant: 'destructive',
        });
      }
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-brand-border p-5 flex flex-col gap-3 hover:shadow-md hover:border-brand-primary/30 transition-all duration-200 cursor-default">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[opp.category] ?? CATEGORY_COLORS.OTHER}`}
        >
          {opp.category}
        </span>
        {opp.matchScore !== undefined && opp.matchScore > 0 && (
          <span className="text-xs font-semibold text-brand-primary bg-brand-bg px-2 py-0.5 rounded-full">
            {opp.matchScore}% match
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-heading font-semibold text-brand-text text-base leading-snug line-clamp-2">
        {opp.title}
      </h3>

      {/* Meta */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-brand-muted">
        {opp.location && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {opp.location.name}
          </span>
        )}
        {opp.isRemote && (
          <span className="flex items-center gap-1 text-brand-primary">
            <Wifi className="w-3 h-3" />
            Remote
          </span>
        )}
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {new Date(opp.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          {' – '}
          {new Date(opp.endDate).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
        <span className="flex items-center gap-1">
          <Briefcase className="w-3 h-3" />
          {opp.hoursPerSession}h/session
        </span>
      </div>

      {/* Skills */}
      {opp.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {opp.skills.slice(0, 4).map((s: string) => (
            <span
              key={s}
              className="text-xs bg-brand-bg text-brand-text border border-brand-border px-2 py-0.5 rounded-full"
            >
              {s}
            </span>
          ))}
          {opp.skills.length > 4 && (
            <span className="text-xs text-brand-muted">+{opp.skills.length - 4} more</span>
          )}
        </div>
      )}

      {/* Slots progress */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-brand-muted">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {filled} / {opp.totalSlots} slots
          </span>
          {isFull && <span className="text-red-600 font-medium">Full</span>}
        </div>
        <div className="h-1.5 bg-brand-border rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isFull ? 'bg-red-400' : 'bg-brand-primary'}`}
            style={{ width: `${fillPct}%` }}
          />
        </div>
      </div>

      {/* Apply button */}
      {showApply && (
        <button
          onClick={handleApply}
          disabled={applying || applied || isFull}
          className={`mt-1 w-full py-2 rounded-xl text-sm font-semibold transition-colors duration-200 cursor-pointer
            ${
              applied
                ? 'bg-emerald-100 text-emerald-700 cursor-default'
                : isFull
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-brand-primary text-white hover:bg-brand-secondary'
            }`}
        >
          {applying ? 'Applying…' : applied ? 'Applied ✓' : 'Apply Now'}
        </button>
      )}
    </div>
  );
});

export { OpportunityCard };
