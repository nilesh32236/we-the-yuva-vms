'use client';

import Image from 'next/image';
import { useInView } from '@/hooks/useInView';

const testimonials = [
  {
    quote:
      "I signed up expecting another app I'd forget. Six months later, I've logged 200+ hours and I run a weekly civic discussion group in my neighbourhood.",
    name: 'Riya Sharma',
    role: 'Mobilizer, Pune',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
  },
  {
    quote:
      "The level system works because it's tied to real output, not just attendance. I had to actually solve a civic problem to reach Level 2.",
    name: 'Arjun Nair',
    role: 'Problem Solver, Bengaluru',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
  },
  {
    quote:
      "As a coordinator, I can see exactly which volunteers are active and what they've done. No more guessing who'll show up.",
    name: 'Priya Verma',
    role: 'NGO Coordinator, Delhi',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&q=80',
  },
];

export function Testimonials() {
  const { ref, inView } = useInView(0.1);

  return (
    <section id="testimonials" className="bg-white py-20 sm:py-28 dark:bg-slate-900">
      <div
        ref={ref}
        className={`mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 motion-safe:transition-opacity motion-safe:duration-700 ${
          inView ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <h2 className="text-center text-3xl font-bold text-slate-900 sm:text-4xl dark:text-white">
          What volunteers say
        </h2>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="rounded-2xl bg-slate-50 p-6 sm:p-8 dark:bg-slate-800"
            >
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                &quot;{t.quote}&quot;
              </p>
              <div className="mt-6 flex items-center gap-3">
                <Image
                  src={t.avatar}
                  alt={t.name}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    {t.name}
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
