'use client';

import { useInView } from '@/hooks/useInView';

const stats = [
  { number: '500+', label: 'NGO Partners' },
  { number: '12,000+', label: 'Certificates Issued' },
  { number: '1,500+', label: 'Events Organized' },
  { number: '85+', label: 'Cities Active' },
];

export function ImpactStats() {
  const { ref, inView } = useInView();

  return (
    <section
      id="impact"
      ref={ref}
      className={`bg-brand-surface dark:bg-brand-bg py-20 sm:py-28 motion-safe:transition-all motion-safe:duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-3xl sm:text-4xl font-bold text-brand-text dark:text-white text-center">
          Where we stand today
        </h2>

        <div
          className={`stagger-group grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto mt-12 ${inView ? 'in-view' : ''}`}
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="card-hover bg-brand-bg dark:bg-brand-surface rounded-2xl p-6 sm:p-8 text-center"
            >
              <p className="tabular-nums text-4xl sm:text-5xl font-bold text-brand-primary dark:text-brand-primary">
                {stat.number}
              </p>
              <p className="text-sm text-brand-muted dark:text-brand-muted mt-2">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
