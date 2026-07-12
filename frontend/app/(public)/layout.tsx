import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-xl focus:bg-brand-primary focus:px-4 focus:py-2.5 focus:text-white focus:font-semibold focus:text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        Skip to main content
      </a>
      <Header />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
