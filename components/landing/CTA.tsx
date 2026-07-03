'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Building2, Sparkles } from 'lucide-react';
import { useInView } from '@/hooks/useInView';

export function CTA() {
  const { ref, inView } = useInView(0.2);

  return (
    <section className="relative py-28 sm:py-36 overflow-hidden">
      {/* Background photo */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=1600&q=80"
          alt="Volunteers raising hands together in celebration of community impact"
          fill
          className="object-cover object-center"
          sizes="100vw"
        />
        {/* Dark overlay — emerald tint */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/95 via-emerald-900/85 to-emerald-800/80" />
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />

      <div ref={ref} className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div
          className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 mb-8 motion-safe:transition-all motion-safe:duration-700 ${
            inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
          <span className="text-sm text-emerald-100 font-medium">Join 7,000+ youth leaders across India</span>
        </div>

        {/* Headline */}
        <h2
          className={`text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight motion-safe:transition-all motion-safe:duration-700 delay-100 ${
            inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          Ready to make
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-cyan-300">
            {' '}a real difference?
          </span>
        </h2>

        {/* Subtext */}
        <p
          className={`mt-6 text-lg sm:text-xl text-emerald-100/75 max-w-2xl mx-auto leading-relaxed motion-safe:transition-all motion-safe:duration-700 delay-200 ${
            inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          Turn your passion into purpose. Your journey from volunteer to community leader starts with a single step — and WeTheYuva walks every step with you.
        </p>

        {/* CTAs */}
        <div
          className={`mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 motion-safe:transition-all motion-safe:duration-700 delay-300 ${
            inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <Link
            href="/register"
            className="group inline-flex items-center gap-2.5 bg-white text-emerald-900 font-bold px-8 py-4 rounded-xl shadow-xl hover:bg-emerald-50 hover:shadow-white/20 hover:shadow-2xl transition-all duration-200 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/50 text-base"
          >
            Join as Volunteer
            <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform duration-200" />
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2.5 border-2 border-white/30 hover:border-white/60 text-white font-bold px-8 py-4 rounded-xl hover:bg-white/10 transition-all duration-200 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/30 text-base"
          >
            <Building2 size={18} />
            Register Organisation
          </Link>
        </div>

        {/* Trust signals */}
        <div
          className={`mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 motion-safe:transition-all motion-safe:duration-700 delay-400 ${
            inView ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {['Free to join', 'No membership fees', 'Recognised certificates', 'Verified opportunities'].map((item) => (
            <span key={item} className="text-xs text-emerald-200/60 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-emerald-400" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
