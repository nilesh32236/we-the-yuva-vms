import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Privacy Policy | WeTheYuva',
    description:
      'WeTheYuva privacy policy — how we collect, use, and protect your personal information.',
  };
}

export default function PrivacyPage() {
  return (
    <>
      <section className="bg-emerald-800 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h1 className="font-heading text-3xl font-bold text-white sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-3 text-emerald-100/80 text-sm">Last updated: July 2026</p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-6 py-16">
        <section className="mb-10">
          <h2 className="font-heading text-xl font-semibold text-brand-text mb-3">
            1. Introduction
          </h2>
          <p className="text-brand-muted leading-relaxed">
            WeTheYuva (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed to
            protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and
            safeguard your information when you use our volunteer management platform.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-heading text-xl font-semibold text-brand-text mb-3">
            2. Information We Collect
          </h2>
          <p className="text-brand-muted leading-relaxed">
            We collect information that you provide directly to us, including your name, email
            address, phone number, location, volunteer hours, and organization details. We also
            collect information automatically through your use of the platform, such as usage data
            and device information.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-heading text-xl font-semibold text-brand-text mb-3">
            3. How We Use Your Information
          </h2>
          <p className="text-brand-muted leading-relaxed">
            We use your information to match you with volunteering opportunities, track your impact,
            communicate with you about platform updates, and improve our services. Your data helps us
            create a better volunteering experience for everyone.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-heading text-xl font-semibold text-brand-text mb-3">
            4. Data Sharing
          </h2>
          <p className="text-brand-muted leading-relaxed">
            We do not sell your personal information. Your data is shared only with partner
            organizations as necessary for volunteering activities, and only with your consent.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-heading text-xl font-semibold text-brand-text mb-3">
            5. Data Security
          </h2>
          <p className="text-brand-muted leading-relaxed">
            We implement industry-standard encryption and secure server infrastructure to protect
            your data. While no method of transmission over the Internet is 100% secure, we strive
            to use commercially acceptable means to protect your personal information.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-heading text-xl font-semibold text-brand-text mb-3">
            6. Your Rights
          </h2>
          <p className="text-brand-muted leading-relaxed">
            You have the right to access, correct, or delete your personal data at any time. You may
            also request a copy of the data we hold about you. To exercise these rights, please
            contact us using the information below.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-heading text-xl font-semibold text-brand-text mb-3">7. Contact</h2>
          <p className="text-brand-muted leading-relaxed">
            If you have questions about this Privacy Policy or our data practices, please email us
            at{' '}
            <a
              href="mailto:hello@wetheyuva.org"
              className="text-brand-primary font-medium hover:underline"
            >
              hello@wetheyuva.org
            </a>
            .
          </p>
        </section>
      </div>
    </>
  );
}
