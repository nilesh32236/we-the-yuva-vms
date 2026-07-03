'use client';

import Image from 'next/image';
import { Heart, Eye, CheckCircle2 } from 'lucide-react';
import { useInView } from '@/hooks/useInView';

const missionItems = [
  'Create meaningful volunteering opportunities across India',
  'Develop youth leadership through real-world challenges',
  'Build bridges between communities and change-makers',
];

const visionItems = [
  '16,000+ active youth leaders by 2030',
  'Pan-India presence across urban and rural communities',
  'A replicable model for civic engagement and youth development',
];

export function MissionVision() {
  const { ref, inView } = useInView(0.1);

  return (
    <section id="about" className="py-24 sm:py-32 bg-white dark:bg-slate-950 overflow-hidden">
      <div ref={ref} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section label */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] mb-3">
            Who We Are
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white leading-tight">
            Built on a simple belief —<br />
            <span className="text-emerald-600 dark:text-emerald-400">every youth can lead.</span>
          </h2>
          <p className="mt-5 text-slate-500 dark:text-slate-400 leading-relaxed text-lg">
            WeTheYuva is a structured platform turning individual passion into collective impact across India.
          </p>
        </div>

        {/* Main grid — photo + cards */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — photo stack */}
          <div
            className={`relative motion-safe:transition-all motion-safe:duration-700 ${
              inView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
            }`}
          >
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl shadow-emerald-900/20">
              <Image
                src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&q=85"
                alt="Youth volunteers planting trees together in a community drive"
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/60 via-transparent to-transparent" />

              {/* Floating badge */}
              <div className="absolute bottom-6 left-6 right-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                  &ldquo;We believe every young person has the power to create change.&rdquo;
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">— WeTheYuva Foundation</p>
              </div>
            </div>

            {/* Second smaller photo — offset */}
            <div className="absolute -top-6 -right-6 w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden border-4 border-white dark:border-slate-950 shadow-xl hidden sm:block">
              <Image
                src="https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=400&q=80"
                alt="Group of volunteers celebrating together"
                fill
                className="object-cover"
                sizes="180px"
              />
            </div>
          </div>

          {/* Right — Mission & Vision cards */}
          <div className="space-y-6">
            {/* Mission card */}
            <div
              className={`bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 rounded-2xl p-7 sm:p-8 motion-safe:transition-all motion-safe:duration-700 delay-200 ${
                inView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-md">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-500">Our Mission</span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Drive Structured Impact</h3>
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                To build a structured, scalable volunteer movement that empowers every young
                Indian to discover their potential through active citizenship, community service,
                and leadership development.
              </p>
              <ul className="mt-5 space-y-2.5">
                {missionItems.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Vision card */}
            <div
              className={`bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-100 dark:border-cyan-900/50 rounded-2xl p-7 sm:p-8 motion-safe:transition-all motion-safe:duration-700 delay-350 ${
                inView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-600 flex items-center justify-center shadow-md">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-cyan-500">Our Vision</span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">India 2030</h3>
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                A self-sustaining ecosystem of 16,000+ active citizens across India by 2030,
                where every young person progresses from an onboarded volunteer to a community
                leader driving lasting change.
              </p>
              <ul className="mt-5 space-y-2.5">
                {visionItems.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-cyan-500 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
