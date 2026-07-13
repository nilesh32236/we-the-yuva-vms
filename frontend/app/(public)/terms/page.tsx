import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Terms of Service | WeTheYuva',
    description:
      'WeTheYuva terms of service — the rules and guidelines for using our volunteer management platform.',
  };
}

export default function TermsPage() {
  return (
    <>
      <section className="bg-brand-primary py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h1 className="font-heading text-3xl font-bold text-white sm:text-4xl">
            Terms of Service
          </h1>
          <p className="mt-3 text-brand-muted text-sm">Last updated: July 2026</p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-6 py-16">
        <section className="mb-10">
          <h2 className="font-heading text-xl font-semibold text-brand-text mb-3">
            1. Acceptance of Terms
          </h2>
          <p className="text-brand-muted leading-relaxed">
            By accessing or using the WeTheYuva platform, you agree to be bound by these Terms of
            Service. If you do not agree to these terms, please do not use the platform.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-heading text-xl font-semibold text-brand-text mb-3">
            2. User Accounts
          </h2>
          <p className="text-brand-muted leading-relaxed">
            You are responsible for providing accurate information when creating an account and for
            maintaining the security of your account credentials. Each account is intended for use
            by one individual only. You must notify us immediately of any unauthorized use of your
            account.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-heading text-xl font-semibold text-brand-text mb-3">
            3. Volunteer Conduct
          </h2>
          <p className="text-brand-muted leading-relaxed">
            Volunteers agree to behave respectfully toward all platform users, log hours accurately,
            and refrain from harassment or any form of misconduct. Violation of these standards may
            result in account suspension.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-heading text-xl font-semibold text-brand-text mb-3">
            4. Organization Conduct
          </h2>
          <p className="text-brand-muted leading-relaxed">
            Organizations must provide accurate opportunity listings and verify volunteer hours in a
            timely manner. Misrepresentation or failure to meet commitments may affect your
            organization&rsquo;s standing on the platform.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-heading text-xl font-semibold text-brand-text mb-3">
            5. Limitation of Liability
          </h2>
          <p className="text-brand-muted leading-relaxed">
            The WeTheYuva platform is provided on an &ldquo;as-is&rdquo; basis. We make no
            warranties regarding the availability, accuracy, or reliability of the platform. We are
            not liable for any damages arising from your use of the platform.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-heading text-xl font-semibold text-brand-text mb-3">
            6. Changes to Terms
          </h2>
          <p className="text-brand-muted leading-relaxed">
            We reserve the right to modify these terms at any time. Users will be notified of
            material changes via email or platform notification. Continued use of the platform after
            changes constitutes acceptance of the updated terms.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-heading text-xl font-semibold text-brand-text mb-3">7. Contact</h2>
          <p className="text-brand-muted leading-relaxed">
            For questions about these terms, please contact us at{' '}
            <a
              href="mailto:hello@wetheyuva.org"
              className="text-brand-primary font-medium hover:underline focus-visible:ring-2 focus-visible:ring-ring inline-block py-2.5"
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
