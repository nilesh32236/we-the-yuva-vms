'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useInView } from '@/hooks/useInView';
import { Users, Clock, Heart, MapPin, TrendingUp } from 'lucide-react';

const stats = [
  {
    icon: Users,
    value: 7000,
    suffix: '+',
    label: 'Volunteers Registered',
    sub: 'Across India',
    color: 'text-emerald-400',
    glow: 'shadow-emerald-500/20',
  },
  {
    icon: Clock,
    value: 50000,
    suffix: '+',
    label: 'Hours Contributed',
    sub: 'Of community service',
    color: 'text-cyan-400',
    glow: 'shadow-cyan-500/20',
  },
  {
    icon: Heart,
    value: 200,
    suffix: '+',
    label: 'Communities Impacted',
    sub: 'Urban & rural',
    color: 'text-violet-400',
    glow: 'shadow-violet-500/20',
  },
  {
    icon: MapPin,
    value: 15,
    suffix: '+',
    label: 'States Reached',
    sub: 'And growing',
    color: 'text-amber-400',
    glow: 'shadow-amber-500/20',
  },
];

function AnimatedCounter({ target, suffix, start }: { target: number; suffix: string; start: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;
    const duration = 2200;
    const steps = 70;
    let current = 0;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      // Ease out — slow down towards the end
      const progress = step / steps;
      const eased = 1 - (1 - progress) ** 3;
      current = Math.floor(eased * target);
      setCount(current);
      if (step >= steps) {
        setCount(target);
        clearInterval(timer);
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target, start]);

  return (
    <span>
      {count.toLocaleString('en-IN')}
      {suffix}
    </span>
  );
}

export function ImpactStats() {
  const { ref, inView } = useInView(0.2);

  return (
    <section id="impact" className="relative py-24 sm:py-32 bg-emerald-950 dark:bg-slate-950 overflow-hidden">
      {/* Background photo overlay */}
      <div className="absolute inset-0 opacity-10">
        <Image
          src="https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=1400&q=60"
          alt=""
          fill
          className="object-cover object-center"
          sizes="100vw"
          aria-hidden="true"
        />
      </div>

      {/* Glow orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div ref={ref} className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div
          className={`text-center max-w-2xl mx-auto mb-16 motion-safe:transition-all motion-safe:duration-700 ${
            inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <span className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-[0.2em] mb-3">
            <TrendingUp className="w-3.5 h-3.5" />
            Our Impact
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
            Numbers that tell
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-cyan-300">
              {' '}real stories
            </span>
          </h2>
          <p className="mt-5 text-emerald-100/60 leading-relaxed">
            Every number represents a life touched, a skill developed, or a community strengthened through collective action.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`group relative bg-white/5 hover:bg-white/8 border border-white/8 hover:border-white/15 rounded-2xl p-6 sm:p-8 text-center transition-all duration-300 cursor-default motion-safe:transition-all motion-safe:duration-700 ${
                inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
              }`}
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 mb-5 ${stat.color}`}>
                <stat.icon className="w-6 h-6" strokeWidth={1.5} />
              </div>

              {/* Number */}
              <div className={`text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-2 tabular-nums`}>
                {inView ? (
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} start={inView} />
                ) : (
                  <span>0{stat.suffix}</span>
                )}
              </div>

              {/* Label */}
              <div className="text-sm font-semibold text-white/80">{stat.label}</div>
              <div className="text-xs text-white/40 mt-1">{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Bottom strip */}
        <div
          className={`mt-16 text-center motion-safe:transition-all motion-safe:duration-700 delay-500 ${
            inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <p className="text-emerald-200/50 text-sm">
            Data as of 2025 · Updated quarterly · Verified by partner organisations
          </p>
        </div>
      </div>
    </section>
  );
}
