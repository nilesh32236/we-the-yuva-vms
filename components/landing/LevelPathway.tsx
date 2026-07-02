'use client';

import { useInView } from '@/hooks/useInView';
import { UserPlus, Users, Lightbulb, Crown } from 'lucide-react';

const levels = [
  {
    icon: UserPlus,
    title: 'Onboarded',
    subtitle: 'Level 0',
    target: '7,000',
    description: 'Sign up and attend orientation. Start your journey as an active citizen.',
    color: 'text-emerald-500',
    dotColor: 'bg-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
  },
  {
    icon: Users,
    title: 'Mobilizer',
    subtitle: 'Level 1',
    target: '5,000',
    description: 'Engage 5+ citizens in documented civic discussions and community activities.',
    color: 'text-cyan-500',
    dotColor: 'bg-cyan-500',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/40',
    borderColor: 'border-cyan-200 dark:border-cyan-800',
  },
  {
    icon: Lightbulb,
    title: 'Problem Solver',
    subtitle: 'Level 2',
    target: '3,000',
    description: 'Submit formal civic grievances and follow through to resolution.',
    color: 'text-violet-500',
    dotColor: 'bg-violet-500',
    bgColor: 'bg-violet-50 dark:bg-violet-950/40',
    borderColor: 'border-violet-200 dark:border-violet-800',
  },
  {
    icon: Crown,
    title: 'Leadership',
    subtitle: 'Level 3',
    target: '1,000',
    description: 'Resolve community issues and mentor the next generation of volunteers.',
    color: 'text-amber-500',
    dotColor: 'bg-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-950/40',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
];

function LevelCard({ level, index }: { level: (typeof levels)[0]; index: number }) {
  const { ref, inView } = useInView(0.1);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      <div
        className={`${level.bgColor} ${level.borderColor} border rounded-2xl p-6 sm:p-8 hover:shadow-lg transition-all hover:scale-[1.02]`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${level.bgColor} flex items-center justify-center ${level.color}`}>
            <level.icon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-brand-muted">{level.subtitle}</span>
            <h3 className="text-lg font-bold text-brand-text">{level.title}</h3>
          </div>
        </div>
        <p className="mt-4 text-sm text-brand-muted leading-relaxed">{level.description}</p>
        <div className="mt-4 flex items-center gap-2">
          <span className="text-2xl font-bold text-brand-text">{level.target}</span>
          <span className="text-xs text-brand-muted">target</span>
        </div>
      </div>
    </div>
  );
}

export function LevelPathway() {
  const { ref: sectionRef, inView: sectionInView } = useInView(0.05);

  return (
    <section id="pathway" className="py-24 sm:py-32 bg-brand-bg overflow-hidden">
      <div ref={sectionRef} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold text-brand-primary uppercase tracking-wider">
            Growth Pathway
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-brand-text">
            From Volunteer to Leader
          </h2>
          <p className="mt-4 text-brand-muted">
            A structured progression that transforms passion into impact. Every level builds
            on the last, creating capable community leaders.
          </p>
        </div>

        <div className="lg:hidden space-y-6">
          {levels.map((level, i) => (
            <LevelCard key={level.title} level={level} index={i} />
          ))}
        </div>

        <div className="hidden lg:grid lg:grid-cols-[1fr_48px_1fr] lg:gap-x-8 lg:gap-y-16 relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-200 via-cyan-200 via-violet-200 to-amber-200 dark:from-emerald-800 dark:via-cyan-800 dark:via-violet-800 dark:to-amber-800 -translate-x-1/2 z-0" />

          {levels.map((level, i) => {
            const isLeft = i % 2 === 0;
            return (
              <div
                key={level.title}
                className={`contents transition-all duration-700 ${
                  sectionInView ? 'opacity-100' : 'opacity-0'
                }`}
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                <div className={`flex items-center ${isLeft ? '' : 'justify-end'}`}>
                  {isLeft && <LevelCard level={level} index={i} />}
                </div>

                <div className="flex items-center justify-center z-10">
                  <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 border-4 border-brand-border flex items-center justify-center shadow-sm">
                    <div className={`w-3 h-3 rounded-full ${level.dotColor}`} />
                  </div>
                </div>

                <div className={`flex items-center ${isLeft ? 'justify-start' : ''}`}>
                  {!isLeft && <LevelCard level={level} index={i} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
