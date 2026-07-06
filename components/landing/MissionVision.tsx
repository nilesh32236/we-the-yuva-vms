'use client';

import { Heart, TrendingUp, Shield } from 'lucide-react';
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
      className={`bg-brand-surface dark:bg-brand-bg py-20 sm:py-28 motion-safe:transition-all motion-safe:duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-3xl sm:text-4xl font-bold text-brand-text dark:text-white text-center">
          What WeTheYuva does
        </h2>
        <p className="text-brand-muted dark:text-brand-muted mt-4 text-center max-w-2xl mx-auto">
          We connect volunteers with organisations that need them, and track every hour, every
          skill, and every community you reach.
        </p>

        <div className={`stagger-group grid md:grid-cols-3 gap-8 mt-14 ${inView ? 'in-view' : ''}`}>
          {cards.map((card) => (
            <div key={card.title} className="card-hover bg-brand-bg dark:bg-brand-surface rounded-2xl p-6 sm:p-8">
              <div className="w-10 h-10 rounded-lg bg-brand-bg dark:bg-brand-primary/20 flex items-center justify-center">
                <card.icon
                  className="w-5 h-5 text-brand-primary dark:text-brand-primary"
                  aria-hidden="true"
                />
              </div>
              <h3 className="text-lg font-semibold text-brand-text dark:text-white mt-4">
                {card.title}
              </h3>
              <p className="text-sm text-brand-muted dark:text-brand-muted mt-2 leading-relaxed">
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
