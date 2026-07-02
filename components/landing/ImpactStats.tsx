'use client';

import { useEffect, useState } from 'react';
import { useInView } from '@/hooks/useInView';
import { Users, Clock, Heart, MapPin } from 'lucide-react';

const stats = [
  { icon: Users, value: 7000, suffix: '+', label: 'Volunteers Registered', color: 'text-emerald-500' },
  { icon: Clock, value: 50000, suffix: '+', label: 'Hours Contributed', color: 'text-cyan-500' },
  { icon: Heart, value: 200, suffix: '+', label: 'Communities Impacted', color: 'text-violet-500' },
  { icon: MapPin, value: 15, suffix: '+', label: 'States Reached', color: 'text-amber-500' },
];

function AnimatedCounter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target === 0) return;
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);

  return (
    <span>
      {count.toLocaleString()}{suffix}
    </span>
  );
}

export function ImpactStats() {
  const { ref, inView } = useInView(0.3);

  return (
    <section id="impact" className="py-24 sm:py-32 bg-white dark:bg-slate-900">
      <div ref={ref} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold text-brand-primary uppercase tracking-wider">
            Our Impact
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-brand-text">
            Making a Difference Together
          </h2>
          <p className="mt-4 text-brand-muted">
            Every number represents a life touched, a skill developed, or a community strengthened
            through collective action.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`text-center p-8 rounded-2xl bg-brand-bg border border-brand-border transition-all duration-700 hover:shadow-lg ${
                inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
              }`}
              style={{ transitionDelay: `${stats.indexOf(stat) * 150}ms` }}
            >
              <stat.icon className={`w-8 h-8 mx-auto mb-4 ${stat.color}`} />
              <div className={`text-3xl sm:text-4xl font-bold text-brand-text ${inView ? '' : 'invisible'}`}>
                {inView ? <AnimatedCounter target={stat.value} suffix={stat.suffix} /> : '0'}
              </div>
              <div className="text-sm text-brand-muted mt-2">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
