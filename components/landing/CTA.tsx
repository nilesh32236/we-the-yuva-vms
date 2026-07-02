'use client';

import Link from 'next/link';
import { ArrowRight, Building2 } from 'lucide-react';
import { useInView } from '@/hooks/useInView';

export function CTA() {
  const { ref, inView } = useInView(0.3);

  return (
    <section className="py-24 sm:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700 dark:from-slate-900 dark:via-emerald-950 dark:to-slate-800" />
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 right-10 w-64 h-64 bg-emerald-300 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-cyan-300 rounded-full blur-3xl" />
      </div>

      <div ref={ref} className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <h2
          className={`text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight motion-safe:transition-all duration-700 ${
            inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          Ready to Make a Difference?
        </h2>

        <p
          className={`mt-6 text-lg text-emerald-100/80 max-w-2xl mx-auto leading-relaxed motion-safe:transition-all duration-700 delay-100 ${
            inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          Join thousands of youth across India who are turning their passion into purpose.
          Your journey from volunteer to leader starts here.
        </p>

        <div
          className={`mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 motion-safe:transition-all duration-700 delay-200 ${
            inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-white text-emerald-900 font-semibold px-8 py-3.5 rounded-xl hover:bg-emerald-50 transition-all hover:shadow-xl hover:scale-105 active-bounce focus:outline-none focus-visible:ring-4 focus-visible:ring-white/50"
          >
            Join as Volunteer
            <ArrowRight size={18} />
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 border-2 border-white/30 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-all hover:border-white/50 active-bounce focus:outline-none focus-visible:ring-4 focus-visible:ring-white/50"
          >
            Register Organization
            <Building2 size={18} />
          </Link>
        </div>

        <p
          className={`mt-8 text-sm text-emerald-100/60 motion-safe:transition-all duration-700 delay-300 ${
            inView ? 'opacity-100' : 'opacity-0'
          }`}
        >
          Free to join. No membership fees. Start making an impact today.
        </p>
      </div>
    </section>
  );
}
