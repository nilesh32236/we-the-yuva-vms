import { Clock, Instagram, Linkedin, Mail, MapPin, Twitter, Youtube } from 'lucide-react';
import type { Metadata } from 'next';
import { ContactForm } from './client';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Contact Us | WeTheYuva',
    description:
      "Get in touch with the WeTheYuva team. We'd love to hear from you — whether you're a volunteer, NGO partner, or just curious.",
    openGraph: {
      title: 'Contact Us | WeTheYuva',
      description: 'Get in touch with the WeTheYuva team.',
      type: 'website',
      locale: 'en_IN',
      siteName: 'WeTheYuva',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Contact Us | WeTheYuva',
      description: 'Get in touch with the WeTheYuva team.',
    },
  };
}

export default function ContactPage() {
  return (
    <div className="min-h-dvh bg-brand-bg">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 lg:py-12">
        <div className="mb-10">
          <h1 className="font-heading font-bold text-3xl text-brand-text md:text-4xl">
            Get in touch
          </h1>
          <p className="mt-2 text-brand-muted text-sm md:text-base">
            Have a question, idea, or want to partner with us? We&apos;re all ears.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12">
          <ContactForm />

          <div className="space-y-4">
            <div className="rounded-2xl border border-brand-border p-6 bg-brand-surface">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10">
                  <Mail className="h-5 w-5 text-brand-primary" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-heading font-semibold text-brand-text">Email</h2>
                  <a
                    href="mailto:hello@wetheyuva.org"
                    className="mt-1 block text-sm text-brand-muted hover:text-brand-primary transition-colors"
                  >
                    hello@wetheyuva.org
                  </a>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-brand-border p-6 bg-brand-surface">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10">
                  <MapPin className="h-5 w-5 text-brand-primary" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-heading font-semibold text-brand-text">Location</h2>
                  <p className="mt-1 text-sm text-brand-muted">Pan-India &middot; Est. 2023</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-brand-border p-6 bg-brand-surface">
              <h2 className="font-heading font-semibold text-brand-text mb-3">Follow us</h2>
              <div className="flex gap-3">
                <a
                  href="https://x.com/intent/follow?screen_name=wetheyuva"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-border bg-background text-brand-muted hover:text-brand-primary hover:border-brand-primary transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none"
                  aria-label="Twitter"
                >
                  <Twitter className="h-4 w-4" aria-hidden="true" />
                </a>
                <a
                  href="https://instagram.com/wetheyuva"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-border bg-background text-brand-muted hover:text-brand-primary hover:border-brand-primary transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none"
                  aria-label="Instagram"
                >
                  <Instagram className="h-4 w-4" aria-hidden="true" />
                </a>
                <a
                  href="https://linkedin.com/company/wetheyuva"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-border bg-background text-brand-muted hover:text-brand-primary hover:border-brand-primary transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-4 w-4" aria-hidden="true" />
                </a>
                <a
                  href="https://youtube.com/@wetheyuva"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-border bg-background text-brand-muted hover:text-brand-primary hover:border-brand-primary transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none"
                  aria-label="YouTube"
                >
                  <Youtube className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-brand-border p-6 bg-brand-surface">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10">
                  <Clock className="h-5 w-5 text-brand-primary" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-heading font-semibold text-brand-text">Response time</h2>
                  <p className="mt-1 text-sm text-brand-muted">
                    We typically respond within 48 hours
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
