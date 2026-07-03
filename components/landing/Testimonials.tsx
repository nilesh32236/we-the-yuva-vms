'use client';

import Image from 'next/image';
import { Quote } from 'lucide-react';
import { useInView } from '@/hooks/useInView';

const testimonials = [
  {
    id: 'riya-sharma',
    quote:
      'WeTheYuva gave me a clear path to go from just caring about my city to actually changing it. The level system keeps me motivated and the community is genuinely inspiring.',
    name: 'Riya Sharma',
    role: 'Level 2 Problem Solver · Pune',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&q=80',
    accent: 'border-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  {
    id: 'arjun-nair',
    quote:
      'I was sceptical at first — another volunteer app. But the platform actually tracks real impact. I\'ve mobilised over 30 citizens in just three months through WeTheYuva.',
    name: 'Arjun Nair',
    role: 'Community Mobilizer · Bengaluru',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    accent: 'border-cyan-500',
    badge: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  },
  {
    id: 'priya-verma',
    quote:
      'As an NGO coordinator, WeTheYuva has transformed how we manage volunteers. The verification system means we always work with committed, trained youth.',
    name: 'Priya Verma',
    role: 'NGO Coordinator · Delhi',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&q=80',
    accent: 'border-violet-500',
    badge: 'bg-violet-50 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  },
];

function TestimonialCard({ t, index }: { t: (typeof testimonials)[0]; index: number }) {
  const { ref, inView } = useInView(0.2);

  return (
    <div
      ref={ref}
      className={`motion-safe:transition-all motion-safe:duration-700 ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      <div className={`h-full bg-white dark:bg-slate-800 border-t-4 ${t.accent} rounded-2xl p-7 sm:p-8 shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col`}>
        {/* Quote icon */}
        <Quote className="w-8 h-8 text-slate-200 dark:text-slate-700 mb-4 shrink-0" strokeWidth={1} />

        {/* Quote text */}
        <p className="text-slate-700 dark:text-slate-300 leading-relaxed flex-1 text-sm sm:text-base">
          &ldquo;{t.quote}&rdquo;
        </p>

        {/* Author */}
        <div className="mt-6 flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-slate-100 dark:border-slate-700 shrink-0">
            <Image
              src={t.avatar}
              alt={`Photo of ${t.name}`}
              fill
              className="object-cover"
              sizes="44px"
            />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">{t.name}</div>
            <div className={`text-xs font-medium px-2 py-0.5 rounded-full mt-0.5 inline-block ${t.badge}`}>
              {t.role}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Testimonials() {
  const { ref, inView } = useInView(0.1);

  return (
    <section id="testimonials" className="py-24 sm:py-32 bg-slate-50 dark:bg-slate-900">
      <div ref={ref} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div
          className={`text-center max-w-2xl mx-auto mb-16 motion-safe:transition-all motion-safe:duration-700 ${
            inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <span className="inline-block text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] mb-3">
            Volunteer Stories
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white leading-tight">
            Heard from the
            <span className="text-emerald-600 dark:text-emerald-400"> people who matter</span>
          </h2>
          <p className="mt-5 text-slate-500 dark:text-slate-400 leading-relaxed">
            Real words from volunteers, mobilizers, and coordinators who are part of India&apos;s growing civic movement.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <TestimonialCard key={t.id} t={t} index={i} />
          ))}
        </div>

        {/* CTA nudge */}
        <div
          className={`mt-14 text-center motion-safe:transition-all motion-safe:duration-700 delay-500 ${
            inView ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Join{' '}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">7,000+ volunteers</span>
            {' '}already making a difference across India.
          </p>
        </div>
      </div>
    </section>
  );
}
