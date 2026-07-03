'use client';

import { useInView } from '@/hooks/useInView';

const stats = [
  { number: '7,000+', label: 'Volunteers' },
  { number: '50,000+', label: 'Hours contributed' },
  { number: '200+', label: 'Communities reached' },
  { number: '15+', label: 'States' },
];

export function ImpactStats() {
  const { ref, inView } = useInView();

  return (
    <section
      id="impact"
      ref={ref}
      className="bg-white dark:bg-slate-900 py-20 sm:py-28"
      style={{
        opacity: inView ? 1 : 0,
        transition: 'opacity 0.6s ease',
      }}
    >
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white text-center">
          Where we stand today
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto mt-12">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-6 sm:p-8 text-center"
            >
              <p className="text-4xl sm:text-5xl font-bold text-emerald-700 dark:text-emerald-400">
                {stat.number}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
