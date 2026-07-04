'use client';

import { Heart, Shield, TrendingUp } from 'lucide-react';
import { useInView } from '@/hooks/useInView';

const cards = [
  {
    icon: Heart,
    title: 'Structured volunteering',
    desc: 'Sign up, get matched with verified opportunities near you, and log your hours.',
  },
  {
    icon: TrendingUp,
    title: 'From volunteer to leader',
    desc: 'Four levels. Each one builds on the last. You start by showing up. You finish by running campaigns.',
  },
  {
    icon: Shield,
    title: 'Recognised impact',
    desc: 'Every hour counts toward certificates, leaderboard rank, and a track record organisations can verify.',
  },
];

export function MissionVision() {
  const { ref, inView } = useInView();

  return (
    <section
      id="about"
      ref={ref}
      className="bg-white dark:bg-slate-900 py-20 sm:py-28"
      style={{
        opacity: inView ? 1 : 0,
        transition: 'opacity 0.6s ease',
      }}
    >
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white text-center">
          What WeTheYuva does
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-4 text-center max-w-2xl mx-auto">
          We connect volunteers with organisations that need them, and track every hour, every
          skill, and every community you reach.
        </p>

        <div className="grid md:grid-cols-3 gap-8 mt-14">
          {cards.map((card) => (
            <div key={card.title} className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-6 sm:p-8">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                <card.icon
                  className="w-5 h-5 text-emerald-700 dark:text-emerald-400"
                  aria-hidden="true"
                />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-4">
                {card.title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
