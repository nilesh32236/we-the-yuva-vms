import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center">
      <Image
        src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1600&q=80"
        alt="Young volunteers collaborating at a community project"
        fill
        className="object-cover"
        priority
      />

      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 mx-auto max-w-2xl px-6 text-center">
        <h1 className="font-heading text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
          7,000 young Indians are building the communities they want to live in.
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg text-white/80">
          WeTheYuva is a volunteer network that gives you real work, real skills,
          and real recognition. Free to join.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3 font-semibold text-slate-900 transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none"
          >
            Join as volunteer
            <ArrowRight className="h-4 w-4" />
          </Link>

          <a
            href="#about"
            className="inline-flex items-center rounded-xl border border-white/40 px-7 py-3 font-semibold text-white transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none"
          >
            Learn more
          </a>
        </div>
      </div>
    </section>
  );
}
