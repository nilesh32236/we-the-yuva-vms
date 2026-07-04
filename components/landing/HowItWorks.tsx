import { BarChart3, Handshake, Search } from 'lucide-react';

const steps = [
  {
    icon: Search,
    title: 'Find your fit',
    desc: 'Browse verified opportunities near you — from tree planting drives to teaching sessions. Filter by cause, location, or skill.',
    step: '01',
  },
  {
    icon: Handshake,
    title: 'Show up & serve',
    desc: 'Join the activity, log your hours, and track your impact. Every contribution is verified and counted.',
    step: '02',
  },
  {
    icon: BarChart3,
    title: 'Grow & lead',
    desc: 'Earn certificates, climb the leaderboard, and progress from volunteer to campaign leader. Real skills, real recognition.',
    step: '03',
  },
];

export function HowItWorks() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-emerald-600">
            How it works
          </span>
          <h2 className="mt-3 font-heading text-3xl font-bold text-slate-900 sm:text-4xl">
            From first click to community leader
          </h2>
          <p className="mt-3 text-slate-500">Three steps. One platform. A lifetime of impact.</p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.step} className="group relative">
              <div className="rounded-2xl border border-slate-100 bg-white p-8 transition-shadow duration-200 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5">
                <span className="font-heading text-5xl font-bold text-emerald-100 transition-colors duration-200 group-hover:text-emerald-200">
                  {step.step}
                </span>
                <div className="mt-4 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                  <step.icon className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
