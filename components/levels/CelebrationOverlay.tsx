'use client';

import { Award, PartyPopper, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CelebrationOverlayProps {
  levelName: string;
  tier: number;
  points: number;
}

export function CelebrationOverlay({ levelName, tier, points }: CelebrationOverlayProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-500">
      <div className="bg-brand-surface rounded-3xl border border-brand-border shadow-2xl p-8 md:p-12 max-w-sm mx-4 text-center relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-600/20 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-gradient-to-br from-emerald-400/20 to-teal-600/20 blur-3xl" />

        <div className="relative z-10 space-y-6">
          <div className="flex justify-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
            <PartyPopper className="w-8 h-8 text-amber-500 dark:text-amber-400" />
            <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
          </div>

          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center mx-auto shadow-lg">
            <Award className="w-10 h-10 text-white" />
          </div>

          <div>
            <h2 className="font-heading font-bold text-2xl text-brand-text">Congratulations!</h2>
            <p className="text-brand-muted mt-2">
              You&apos;ve reached <span className="font-semibold text-brand-text">{levelName}</span> (Tier {tier})
            </p>
          </div>

          <div className="bg-brand-bg rounded-xl p-4 border border-brand-border">
            <p className="text-sm text-brand-muted">Total Points</p>
            <p className="font-heading font-bold text-3xl text-brand-text">{points}</p>
          </div>

          <p className="text-xs text-brand-muted">
            Keep up the great work! More opportunities await at the next level.
          </p>
        </div>
      </div>
    </div>
  );
}
