import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Play } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden">
      <Image
        src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1600&q=80"
        alt="Young volunteers collaborating at a community project"
        fill
        className="object-cover scale-105"
        priority
      />

      <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/70 via-emerald-800/60 to-emerald-900/80" />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.08)_0%,_transparent_70%)]" />

      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-white/80 backdrop-blur-sm mb-6">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          India&apos;s fastest-growing volunteer network
        </div>

        <h1 className="font-heading text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
          7,000 young Indians are building the communities{' '}
          <span className="text-emerald-300">they want to live in</span>.
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg text-emerald-50/80 leading-relaxed">
          WeTheYuva is a volunteer network that gives you real work, real skills, and real
          recognition. Free to join.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-7 py-3.5 font-semibold text-white shadow-lg shadow-emerald-700/30 transition-colors duration-200 hover:bg-emerald-400 hover:shadow-emerald-600/40 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none"
          >
            Join as volunteer
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>

          <Link
            href="/opportunities"
            className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-7 py-3.5 font-semibold text-white backdrop-blur-sm transition-colors duration-200 hover:bg-white/20 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none"
          >
            <Play className="h-4 w-4" aria-hidden="true" />
            Browse opportunities
          </Link>
        </div>

        <div className="mt-12 flex items-center justify-center gap-8 text-white/60 text-xs">
          <span className="flex items-center gap-2">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            200+ NGOs
          </span>
          <span className="flex items-center gap-2">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            50k+ hours logged
          </span>
          <span className="flex items-center gap-2">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            15 states
          </span>
        </div>
      </div>
    </section>
  );
}
