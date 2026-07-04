import { Eye, Lightbulb, Shield, Target, Users, Zap } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Us | WeTheYuva',
  description:
    "WeTheYuva is India's youth volunteer network — connecting young citizens with real opportunities to serve, lead, and transform their communities.",
  openGraph: {
    title: 'About Us | WeTheYuva',
    description:
      "WeTheYuva is India's youth volunteer network — connecting young citizens with real opportunities to serve, lead, and transform their communities.",
    type: 'website',
    locale: 'en_IN',
    siteName: 'WeTheYuva',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Us | WeTheYuva',
    description:
      "WeTheYuva is India's youth volunteer network — connecting young citizens with real opportunities to serve, lead, and transform their communities.",
  },
};

const timeline = [
  {
    year: '2023',
    title: 'Founded by youth leaders',
    desc: 'A small group of college students came together with a shared belief: young India wants to serve, it just needs a path.',
  },
  {
    year: '2024',
    title: '2,000 volunteers across 5 states',
    desc: 'Word spread fast. We partnered with local NGOs and municipal bodies to place volunteers where they mattered most.',
  },
  {
    year: '2025',
    title: 'Level system launched, 5,000+ volunteers',
    desc: 'Gamified progression from Onboarded to Leader — rewarding consistency, impact, and mentorship at every step.',
  },
  {
    year: '2026',
    title: '7,000+ volunteers, 15 states, 200+ communities',
    desc: "From Kerala to Assam, thousands showing up every week. We're just getting started.",
  },
];

const values = [
  {
    icon: Shield,
    title: 'Integrity',
    desc: 'Every commitment we make to volunteers and communities is followed through with transparency and honesty.',
  },
  {
    icon: Zap,
    title: 'Impact',
    desc: 'We measure success by outcomes — trees planted, grievances resolved, lives touched — not by vanity metrics.',
  },
  {
    icon: Users,
    title: 'Inclusion',
    desc: 'We actively reach across caste, class, gender, and geography to ensure every young Indian can find their place.',
  },
  {
    icon: Lightbulb,
    title: 'Innovation',
    desc: 'From gamified level systems to digital grievance tracking, we use technology to amplify volunteer effort.',
  },
];

const containerClass = 'mx-auto max-w-6xl px-6';

export default function AboutPage() {
  return (
    <>
      <section className="bg-emerald-800 py-20 sm:py-28">
        <div className={`${containerClass} text-center`}>
          <span className="inline-block text-emerald-200 text-sm font-semibold tracking-widest uppercase mb-4">
            About Us
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-white leading-tight max-w-3xl mx-auto">
            Building India's largest youth volunteer network
          </h1>
          <p className="text-emerald-100 text-lg sm:text-xl mt-5 max-w-2xl mx-auto leading-relaxed">
            WeTheYuva is a volunteer management platform built by youth, for youth. We connect
            passionate young citizens with verified opportunities to serve their communities and
            build a better India.
          </p>
        </div>
      </section>

      <section className="bg-white dark:bg-slate-900 py-20 sm:py-28">
        <div className={containerClass}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl p-8">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center mb-5">
                <Target className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-slate-900 dark:text-white mb-3">
                Our Mission
              </h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                To build the largest, most trusted volunteer network in India — connecting every
                young citizen with meaningful opportunities to serve, learn, and lead in their
                communities, while equipping organisations with tools to mobilise and manage
                volunteers effectively.
              </p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl p-8">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center mb-5">
                <Eye className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-slate-900 dark:text-white mb-3">
                Our Vision
              </h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                A India where every young person is an active citizen — where volunteerism is a
                norm, not an exception, and where youth-led civic change is the driving force behind
                stronger, more resilient communities across the nation.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 dark:bg-slate-800/50 py-20 sm:py-28">
        <div className={containerClass}>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white text-center">
            Our story
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-center mt-3 max-w-lg mx-auto">
            How a small idea became a national movement.
          </p>
          <div className="max-w-2xl mx-auto mt-14">
            {timeline.map((item, i) => {
              const isLast = i === timeline.length - 1;
              return (
                <div key={item.year} className="flex gap-6 items-start">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                      {item.year}
                    </div>
                    {!isLast && <div className="w-px flex-1 bg-slate-200 dark:bg-slate-700" />}
                  </div>
                  <div className={isLast ? '' : 'pb-12'}>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {item.title}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-slate-900 py-20 sm:py-28">
        <div className={containerClass}>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white text-center">
            What we stand for
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-center mt-3 max-w-lg mx-auto">
            Four values that guide everything we do.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-14">
            {values.map((val) => (
              <div
                key={val.title}
                className="rounded-2xl border border-emerald-100 dark:border-slate-700 p-8 transition-shadow hover:shadow-lg"
              >
                <div className="w-11 h-11 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mb-4">
                  <val.icon
                    className="w-5 h-5 text-emerald-700 dark:text-emerald-400"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="font-heading text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {val.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{val.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-emerald-600 to-emerald-800 py-20 sm:py-28">
        <div className={`${containerClass} text-center`}>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white">
            Ready to make a difference?
          </h2>
          <p className="text-emerald-100 text-lg mt-4">Join 7,000+ volunteers across India</p>
          <div className="mt-8">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-emerald-800 font-semibold text-base transition-colors hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none"
            >
              Get started
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
