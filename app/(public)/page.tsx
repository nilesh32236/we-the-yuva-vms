import { CTA } from '@/components/landing/CTA';
import { FeaturedOpportunities } from '@/components/landing/FeaturedOpportunities';
import { Gallery } from '@/components/landing/Gallery';
import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { LevelPathway } from '@/components/landing/LevelPathway';
import { StatsBar } from '@/components/landing/StatsBar';
import { Testimonials } from '@/components/landing/Testimonials';

export const metadata = {
  title: "WeTheYuva — Empowering India's Youth Volunteers",
  description:
    "Join India's largest youth volunteer network. Connect with meaningful opportunities, grow from volunteer to leader, and build the communities you care about.",
  openGraph: {
    title: "WeTheYuva — Empowering India's Youth Volunteers",
    description:
      "Join India's largest youth volunteer network. Connect with meaningful opportunities, grow from volunteer to leader, and build the communities you care about.",
    type: 'website',
    locale: 'en_IN',
    siteName: 'WeTheYuva',
  },
  twitter: {
    card: 'summary_large_image',
    title: "WeTheYuva — Empowering India's Youth Volunteers",
    description:
      "Join India's largest youth volunteer network. Connect with meaningful opportunities, grow from volunteer to leader, and build the communities you care about.",
  },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsBar />
      <HowItWorks />
      <FeaturedOpportunities />
      <LevelPathway />
      <Gallery />
      <Testimonials />
      <CTA />
    </>
  );
}
