'use client';

import Link from 'next/link';
import { ArrowRight, Users, Building2, Award, Target } from 'lucide-react';
import { useInView } from '@/hooks/useInView';

const stats = [
  { icon: Users, value: '7,000+', label: 'Volunteers Onboarded' },
  { icon: Building2, value: '50+', label: 'Partner Organizations' },
  { icon: Award, value: '5,000+', label: 'Active Mobilizers' },
  { icon: Target, value: '100+', label: 'Communities Reached' },
];

export function Hero() {
  const { ref, inView } = useInView(0.2);

  return (
    <section
      ref={ref}
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 dark:from-slate-950 dark:via-emerald-950 dark:to-slate-900" />

      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-400 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-400 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500 rounded-full blur-3xl opacity-5" />
      </div>

      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-32 sm:py-40">
        <div className="max-w-3xl mx-auto text-center">
          <div
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8 motion-safe:transition-all motion-safe:duration-700 ${
              inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-emerald-100 font-medium">
              Building India&apos;s Largest Youth Volunteer Network
            </span>
          </div>

          <h1
            className={`text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-tight tracking-tight motion-safe:transition-all motion-safe:duration-700 delay-100 ${
              inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Empowering Youth,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-cyan-300">
              Building Communities
            </span>
          </h1>

          <p
            className={`mt-6 text-lg sm:text-xl text-emerald-100/80 max-w-2xl mx-auto leading-relaxed motion-safe:transition-all motion-safe:duration-700 delay-200 ${
              inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            WeTheYuva connects passionate volunteers with meaningful opportunities. Join thousands
            of change-makers transforming communities across India.
          </p>

          <div
            className={`mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 motion-safe:transition-all motion-safe:duration-700 delay-300 ${
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
        </div>

        <div
          className={`mt-20 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 motion-safe:transition-all motion-safe:duration-700 delay-500 ${
            inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 sm:p-6 text-center hover:bg-white/10 transition-all hover:scale-105"
            >
              <stat.icon className="w-6 h-6 mx-auto text-emerald-300 mb-3" />
              <div className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-emerald-100/60 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
