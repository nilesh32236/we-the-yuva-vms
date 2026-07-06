'use client';

import { useInView } from '@/hooks/useInView';

const levels = [
  {
    step: 1,
    color: 'bg-emerald-600',
    dotColor: 'bg-emerald-600',
    title: 'Onboarded',
    desc: "Sign up and attend orientation. You're part of the network.",
    target: '7,000 target',
  },
  {
    step: 2,
    color: 'bg-sky-600',
    dotColor: 'bg-sky-600',
    title: 'Mobilizer',
    desc: 'Bring 5+ citizens into civic discussions. You organise, not just participate.',
    target: '5,000 target',
  },
  {
    step: 3,
    color: 'bg-violet-600',
    dotColor: 'bg-violet-600',
    title: 'Problem Solver',
    desc: 'File civic grievances and follow them to resolution. Accountability work.',
    target: '3,000 target',
  },
  {
    step: 4,
    color: 'bg-amber-600',
    dotColor: 'bg-amber-600',
    title: 'Leadership',
    desc: 'Mentor volunteers and run campaigns. The movement grows through you.',
    target: '1,000 target',
  },
];

export function LevelPathway() {
  const { ref, inView } = useInView();

  return (
    <section
      id="pathway"
      ref={ref}
      className={`bg-muted dark:bg-brand-surface/50 py-20 sm:py-28 motion-safe:transition-all motion-safe:duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-3xl sm:text-4xl font-bold text-brand-text dark:text-white text-center">
          Four levels, one goal
        </h2>
        <p className="text-brand-muted dark:text-brand-muted text-center mt-3">
          You pick the pace. The platform tracks your progress.
        </p>

        <div className="max-w-2xl mx-auto mt-14">
          {levels.map((level, i) => {
            const isLast = i === levels.length - 1;

            return (
              <div key={level.step} className="flex gap-6 items-start">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full ${level.color} text-white font-bold text-sm flex items-center justify-center shrink-0`}
                  >
                    {level.step}
                  </div>
                  {!isLast && <div className="w-px flex-1 bg-brand-border dark:bg-brand-border" />}
                </div>

                <div className={isLast ? '' : 'pb-10'}>
                  <h3 className="text-base font-semibold text-brand-text dark:text-white">
                    {level.title}
                  </h3>
                  <p className="text-sm text-brand-muted mt-1">{level.desc}</p>
                  <p className="text-xs text-brand-muted mt-2 flex items-center gap-1.5">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${level.dotColor}`} />
                    {level.target}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
