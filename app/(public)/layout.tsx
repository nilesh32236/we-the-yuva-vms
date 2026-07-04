import { Footer } from '@/components/landing/Footer';
import { Header } from '@/components/landing/Header';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
