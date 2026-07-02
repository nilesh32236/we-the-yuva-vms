'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Header } from '@/components/landing/Header';
import { Hero } from '@/components/landing/Hero';
import { MissionVision } from '@/components/landing/MissionVision';
import { LevelPathway } from '@/components/landing/LevelPathway';
import { ImpactStats } from '@/components/landing/ImpactStats';
import { Gallery } from '@/components/landing/Gallery';
import { CTA } from '@/components/landing/CTA';
import { Footer } from '@/components/landing/Footer';

const ROLE_ROUTES: Record<string, string> = {
  VOLUNTEER: '/volunteer/dashboard',
  COORDINATOR: '/coordinator/dashboard',
  ORGANIZATION_ADMIN: '/organization/dashboard',
  PLATFORM_MANAGER: '/admin/dashboard',
  ADMIN: '/admin/dashboard',
  OBSERVER: '/observer/dashboard',
};

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !isLoading) {
      const route = ROLE_ROUTES[user.role];
      if (route) router.replace(route);
    }
  }, [user, isLoading, router]);

  if (isLoading || user) return null;

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
        <CTA />
      </main>
      <Footer />
    </>
  );
}
