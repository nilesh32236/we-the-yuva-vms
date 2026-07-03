'use client';

import { useInView } from '@/hooks/useInView';
import { UserPlus, Users, Lightbulb, Crown, ArrowRight } from 'lucide-react';

const levels = [
  {
    icon: UserPlus,
    step: '01',
    title: 'Onboarded Volunteer',
    subtitle: 'Level 0 — Start Here',
    target: '7,000',
    description:
      'Sign up, attend your orientation, and declare yourself an active citizen. Your journey into purposeful action begins.',
    color: 'emerald',
    accent: '#10b981',
    bgLight: 'bg-emerald-50',
    bgDark: 'dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800',
    iconBg: 'bg-emerald-600',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
    stepColor: 'text-emerald-500',
    dot: 'bg-emerald-500',
  },
  {
    icon: Users,
    step: '02',
    title: 'Community Mobilizer',
    subtitle: 'Level 1 — Build Bridges',
    target: '5,000',
    description:
      'Engage 5+ fellow citizens in documented civic discussions, community clean-ups, and awareness drives.',
    color: 'cyan',
    accent: '#06b6d4',
    bgLight: 'bg-cyan-50',
    bgDark: 'dark:bg-cyan-950/30',
    border: 'border-cyan-200 dark:border-cyan-800/60',
    iconBg: 'bg-cyan-600',
    badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/60 dark:text-cyan-300',
    stepColor: 'text-cyan-500',
    dot: 'bg-cyan-500',
  },
  {
    icon: Lightbulb,
    step: '03',
    title: 'Problem Solver',
    subtitle: 'Level 2 — Drive Solutions',
    target: '3,000',
    description:
      'Submit formal civic grievances, track them through to resolution, and document your community impact.',
    color: 'violet',
    accent: '#8b5cf6',
    bgLight: 'bg-violet-50',
    bgDark: 'dark:bg-violet-950/30',
    border: 'border-violet-200 dark:border-violet-800/60',
    iconBg: 'bg-violet-600',
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-300',
    stepColor: 'text-violet-500',
    dot: 'bg-violet-500',
  },
  {
    icon: Crown,
    step: '04',
    title: 'Community Leader',
    subtitle: 'Level 3 — Leave a Legacy',
    target: '1,000',
    description:
      'Resolve systemic community issues and mentor the next wave of volunteers into their own leadership journeys.',
    color: 'amber',
    accent: '#f59e0b',
    bgLight: 'bg-amber-50',
    bgDark: 'dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800/60',
    iconBg: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300',
    stepColor: 'text-amber-500',
    dot: 'bg-amber-500',
  },
];

function LevelCard({ level, index }: { level: (typeof levels)[0]; index: number }) {
  const { ref, inView } = useInView(0.15);
  return (
    <div
      ref={ref}
      className={`motion-safe:transition-all motion-safe:duration-700 ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${index * 120}ms` }}
    >
      <div
        className={`group relative ${level.bgLight} ${level.bgDark} ${level.border} border rounded-2xl p-6 sm:p-7 hover:shadow-lg transition-all duration-300 cursor-default overflow-hidden`}
      >
        {/* Big step number watermark */}
        <span
          className={`absolute -top-3 -right-1 text-8xl font-black opacity-5 select-none leading-none ${level.stepColor}`}
        >
          {level.step}
        </span>

        {/* Header row */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`w-11 h-11 rounded-xl ${level.iconBg} flex items-center justify-center shrink-0 shadow-md`}>
            <level.icon className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <div>
            <span className={`text-xs font-bold uppercase tracking-widest ${level.stepColor}`}>
              {level.subtitle}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
              {level.title}
            </h3>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{level.description}</p>

        {/* Target */}
        <div className="mt-5 flex items-center justify-between">
          <div>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{level.target}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">target volunteers</span>
          </div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${level.badge}`}>
            Step {level.step}
          </span>
        </div>
      </div>
    </div>
  );
}

export function LevelPathway() {
  const { ref: sectionRef, inView: sectionInView } = useInView(0.05);

  return (
    <section id="pathway" className="py-24 sm:py-32 bg-slate-50 dark:bg-slate-900 overflow-hidden">
      <div ref={sectionRef} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div
          className={`text-center max-w-2xl mx-auto mb-16 motion-safe:transition-all motion-safe:duration-700 ${
            sectionInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <span className="inline-block text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] mb-3">
            Growth Pathway
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white leading-tight">
            From Volunteer
            <span className="text-emerald-600 dark:text-emerald-400"> to Leader</span>
          </h2>
          <p className="mt-5 text-slate-500 dark:text-slate-400 leading-relaxed">
            Four structured levels that build your skills, expand your impact, and recognise your growth.
            Each level unlocks new opportunities and responsibilities.
          </p>
        </div>

        {/* Desktop: horizontal flow with arrows */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-5 relative">
          {/* Connecting line */}
          <div
            className={`absolute top-[2.75rem] left-[calc(12.5%+1.5rem)] right-[calc(12.5%+1.5rem)] h-px motion-safe:transition-all motion-safe:duration-1000 delay-300 ${
              sectionInView ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
            }`}
            style={{
              background: 'linear-gradient(90deg, #10b981, #06b6d4, #8b5cf6, #f59e0b)',
              transformOrigin: 'left',
            }}
          />

          {levels.map((level, i) => (
            <div key={level.title} className="relative flex flex-col items-center gap-4">
              {/* Dot on line */}
              <div
                className={`w-6 h-6 rounded-full ${level.dot} border-4 border-white dark:border-slate-900 shadow-md z-10 shrink-0 motion-safe:transition-all motion-safe:duration-500 ${
                  sectionInView ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                }`}
                style={{ transitionDelay: `${300 + i * 150}ms` }}
              />
              <LevelCard level={level} index={i} />
              {/* Arrow connector — not on last */}
              {i < levels.length - 1 && (
                <ArrowRight
                  className={`absolute top-[0.6rem] -right-3 w-5 h-5 text-slate-300 dark:text-slate-600 z-20 motion-safe:transition-all motion-safe:duration-500 ${
                    sectionInView ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{ transitionDelay: `${500 + i * 150}ms` }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Mobile: vertical stack */}
        <div className="lg:hidden space-y-5">
          {levels.map((level, i) => (
            <div key={level.title} className="flex gap-4">
              {/* Vertical line + dot */}
              <div className="flex flex-col items-center">
                <div className={`w-5 h-5 rounded-full ${level.dot} border-4 border-slate-50 dark:border-slate-900 shadow-md shrink-0 mt-5`} />
                {i < levels.length - 1 && (
                  <div className="w-px flex-1 mt-2 bg-gradient-to-b from-slate-300 to-transparent dark:from-slate-700" />
                )}
              </div>
              <div className="flex-1 pb-2">
                <LevelCard level={level} index={i} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
