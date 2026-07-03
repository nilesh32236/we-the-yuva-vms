import { Header } from '@/components/landing/Header';
import { Hero } from '@/components/landing/Hero';
import { MissionVision } from '@/components/landing/MissionVision';
import { LevelPathway } from '@/components/landing/LevelPathway';
import { ImpactStats } from '@/components/landing/ImpactStats';
import { Gallery } from '@/components/landing/Gallery';
import { Testimonials } from '@/components/landing/Testimonials';
import { CTA } from '@/components/landing/CTA';
import { Footer } from '@/components/landing/Footer';

export const metadata = {
  title: 'WeTheYuva — Empowering India\'s Youth Volunteers',
  description:
    'Join India\'s largest youth volunteer network. Connect with meaningful opportunities, grow from volunteer to leader, and build the communities you care about.',
};

export default function HomePage() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-brand-primary focus:text-white focus:rounded-xl focus:outline-none"
      >
        Skip to main content
      </a>
      <Header />
      <main id="main-content">
        <Hero />
        <MissionVision />
        <LevelPathway />
        <ImpactStats />
        <Gallery />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
