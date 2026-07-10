'use client';

import { Search, Handshake, BarChart3 } from 'lucide-react';
import { useInView } from '@/hooks/useInView';

const steps = [
  {
    icon: Search,
    title: 'Find your fit',
    desc: 'Browse verified opportunities near you — from tree planting drives to teaching sessions. Filter by cause, location, or skill.',
    step: '01',
  },
  {
    icon: Handshake,
    title: 'Show up & serve',
    desc: 'Join the activity, log your hours, and track your impact. Every contribution is verified and counted.',
    step: '02',
  },
  {
    icon: BarChart3,
    title: 'Grow & lead',
    desc: 'Earn certificates, climb the leaderboard, and progress from volunteer to campaign leader. Real skills, real recognition.',
    step: '03',
  },
];

export function HowItWorks() {
  const { ref, inView } = useInView(0.1);

  return (
    <section className="bg-brand-surface py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-brand-primary">
            How it works
          </span>
          <h2 className="mt-3 font-heading text-3xl font-bold text-brand-text sm:text-4xl">
            From first click to community leader
          </h2>
          <p className="mt-3 text-brand-muted">Three steps. One platform. A lifetime of impact.</p>
        </div>

        <div
          ref={ref}
          className={`stagger-group mt-16 grid gap-8 md:grid-cols-3 ${inView ? 'in-view' : ''}`}
        >
          {steps.map((step) => (
            <div key={step.step} className="group relative">
              <div className="card-hover rounded-2xl border border-brand-border bg-brand-surface p-8">
                <span className="font-heading text-5xl font-bold text-brand-border transition-colors duration-200 group-hover:text-brand-primary/20">
                  {step.step}
                </span>
                <div className="mt-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-bg">
                  <step.icon className="h-5 w-5 text-brand-primary" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-brand-text">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-muted">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
