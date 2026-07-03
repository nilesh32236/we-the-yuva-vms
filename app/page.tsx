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

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="h-16 bg-brand-surface border-b border-brand-border animate-pulse" />
      <div className="mx-auto max-w-5xl px-4 py-20 space-y-8">
        <div className="h-12 w-3/4 bg-brand-border rounded animate-pulse mx-auto" />
        <div className="h-6 w-1/2 bg-brand-border rounded animate-pulse mx-auto" />
        <div className="grid md:grid-cols-3 gap-4 mt-12">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-brand-border rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !isLoading) {
      const route = ROLE_ROUTES[user.role];
      if (route) router.replace(route);
    }
  }, [user, isLoading, router]);

  if (isLoading) return <LoadingSkeleton />;
  if (user) return <LoadingSkeleton />;

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
