'use client';

import { Heart, Eye, Users } from 'lucide-react';
import { useInView } from '@/hooks/useInView';

export function MissionVision() {
  const { ref, inView } = useInView();

  return (
    <section id="about" className="py-24 sm:py-32 bg-white dark:bg-slate-900">
      <div ref={ref} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold text-brand-primary uppercase tracking-wider">
            About WeTheYuva
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-brand-text">
            Our Mission & Vision
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <div
            className={`bg-brand-bg rounded-2xl p-8 sm:p-10 motion-safe:transition-all duration-700 ${
              inView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center mb-5">
              <Heart className="w-6 h-6 text-brand-primary" />
            </div>
            <h3 className="text-xl font-bold text-brand-text mb-3">Our Mission</h3>
            <p className="text-brand-muted leading-relaxed">
              To build a structured, scalable volunteer movement that empowers every young
              Indian to discover their potential through active citizenship, community service,
              and leadership development.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'Create meaningful volunteering opportunities across India',
                'Develop youth leadership through real-world challenges',
                'Build bridges between communities and change-makers',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-brand-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-primary mt-2 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div
            className={`bg-brand-bg rounded-2xl p-8 sm:p-10 motion-safe:transition-all duration-700 delay-200 ${
              inView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-brand-cta/10 flex items-center justify-center mb-5">
              <Eye className="w-6 h-6 text-brand-cta" />
            </div>
            <h3 className="text-xl font-bold text-brand-text mb-3">Our Vision</h3>
            <p className="text-brand-muted leading-relaxed">
              A self-sustaining ecosystem of 16,000+ active citizens across India by 2030,
              where every young person progresses from an onboarded volunteer to a community
              leader driving lasting change.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                '16,000+ active youth leaders by 2030',
                'Pan-India presence across urban and rural communities',
                'A replicable model for civic engagement and youth development',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-brand-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-cta mt-2 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          className={`mt-12 text-center bg-gradient-to-r from-brand-primary/5 via-brand-cta/5 to-brand-primary/5 rounded-2xl p-8 sm:p-10 motion-safe:transition-all duration-700 delay-400 ${
            inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <Users className="w-8 h-8 mx-auto text-brand-primary mb-4" />
          <p className="text-lg text-brand-text font-medium max-w-3xl mx-auto">
            &ldquo;We believe every young person has the power to create change. Our platform
            provides the structure, opportunities, and recognition to turn that belief into
            action.&rdquo;
          </p>
        </div>
      </div>
    </section>
  );
}
