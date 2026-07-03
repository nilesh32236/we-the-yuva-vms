'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Building2, ChevronDown, Users, Clock, Heart, MapPin } from 'lucide-react';
import { useInView } from '@/hooks/useInView';

const stats = [
  { icon: Users, value: '7,000+', label: 'Volunteers' },
  { icon: Clock, value: '50K+', label: 'Hours Given' },
  { icon: Heart, value: '200+', label: 'Communities' },
  { icon: MapPin, value: '15+', label: 'States' },
];

export function Hero() {
  const { ref, inView } = useInView(0.1);

  return (
    <section
      ref={ref}
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden bg-emerald-950"
    >
      {/* Background photo — right panel bleeds into full bg on mobile */}
      <div className="absolute inset-0 lg:left-[50%]">
        <Image
          src="https://images.unsplash.com/photo-1593113598332-cd288d649433?w=1200&q=85"
          alt="Young Indian volunteers working together in a community event"
          fill
          priority
          className="object-cover object-center"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
        {/* Gradient overlay — heavier on mobile (full coverage), partial on desktop */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950 via-emerald-950/90 lg:via-emerald-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-transparent to-emerald-950/20" />
      </div>

      {/* Decorative blobs */}
      <div className="absolute top-20 left-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-cyan-400/8 rounded-full blur-3xl pointer-events-none" />

      {/* Content */}
      <div className="relative w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-32 sm:py-40 lg:py-0 min-h-screen flex flex-col justify-center">
        <div className="max-w-2xl">
          {/* Badge */}
          <div
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/15 backdrop-blur-sm border border-emerald-400/30 mb-7 motion-safe:transition-all motion-safe:duration-700 ${
              inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-emerald-200 font-medium tracking-wide">
              India&apos;s Largest Youth Volunteer Network
            </span>
          </div>

          {/* Headline */}
          <h1
            className={`text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.08] tracking-tight motion-safe:transition-all motion-safe:duration-700 delay-100 ${
              inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Empowering
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-emerald-200 to-cyan-300">
              Youth.
            </span>
            <br />
            Building
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-emerald-300">
              Communities.
            </span>
          </h1>

          {/* Sub-headline */}
          <p
            className={`mt-6 text-lg sm:text-xl text-emerald-100/75 max-w-lg leading-relaxed motion-safe:transition-all motion-safe:duration-700 delay-200 ${
              inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            WeTheYuva connects passionate young Indians with verified volunteering
            opportunities. Grow from volunteer to community leader — with every step recognised.
          </p>

          {/* CTAs */}
          <div
            className={`mt-9 flex flex-col sm:flex-row items-start sm:items-center gap-4 motion-safe:transition-all motion-safe:duration-700 delay-300 ${
              inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <Link
              href="/register"
              className="group inline-flex items-center gap-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-emerald-900/40 hover:shadow-emerald-500/30 hover:shadow-xl transition-all duration-200 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/50"
            >
              Join as Volunteer
              <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform duration-200" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2.5 border border-white/25 hover:border-white/50 text-white/90 hover:text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/8 transition-all duration-200 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
            >
              <Building2 size={18} />
              Register Organisation
            </Link>
          </div>

          {/* Trust line */}
          <p
            className={`mt-5 text-sm text-emerald-300/60 motion-safe:transition-all motion-safe:duration-700 delay-400 ${
              inView ? 'opacity-100' : 'opacity-0'
            }`}
          >
            Free to join · No fees · Recognised certificates
          </p>
        </div>

        {/* Stats row */}
        <div
          className={`mt-16 lg:mt-20 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-2xl motion-safe:transition-all motion-safe:duration-700 delay-500 ${
            inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="group bg-white/6 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-2xl p-4 sm:p-5 flex flex-col gap-1 transition-all duration-200 cursor-default"
            >
              <stat.icon className="w-5 h-5 text-emerald-400 mb-1" strokeWidth={1.5} />
              <span className="text-2xl sm:text-3xl font-bold text-white leading-none">{stat.value}</span>
              <span className="text-xs text-emerald-200/60">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <a
        href="#about"
        aria-label="Scroll to about section"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/40 hover:text-white/70 transition-colors duration-200 focus:outline-none focus-visible:text-white/70"
      >
        <span className="text-xs tracking-widest uppercase font-medium">Scroll</span>
        <ChevronDown size={20} className="animate-bounce" />
      </a>
    </section>
  );
}
