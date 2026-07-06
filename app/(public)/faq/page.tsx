import { ChevronDown } from 'lucide-react';
import type { Metadata } from 'next';

const faqData = [
  {
    section: 'Getting Started',
    items: [
      {
        question: 'How do I join WeTheYuva?',
        answer:
          "Sign up on the platform, attend a brief orientation session, and you're ready to start volunteering. We'll walk you through everything step by step.",
      },
      {
        question: 'Is there any fee to volunteer?',
        answer:
          'No. Volunteering with WeTheYuva is completely free — always has been, always will be.',
      },
      {
        question: 'Do I need prior experience?',
        answer:
          "Not at all. We provide training and orientation for every opportunity. If you have the willingness to contribute, we'll equip you with everything you need.",
      },
      {
        question: 'What is the minimum time commitment?',
        answer:
          'We keep it flexible. You can start with as little as 2 hours per week and gradually increase based on your availability.',
      },
    ],
  },
  {
    section: 'Volunteering',
    items: [
      {
        question: 'How do I find opportunities near me?',
        answer:
          "Head to the Opportunities page and use the filters to search by location, category, or cause. You'll find volunteering options that match your interests and area.",
      },
      {
        question: 'How are hours tracked?',
        answer:
          'Hours are logged through the platform after every session. Your coordinator verifies the entries, and they get added to your profile automatically.',
      },
      {
        question: 'Can I volunteer with a friend?',
        answer:
          "Absolutely. You can form a team and volunteer together. Many hands make light work, and it's more fun too.",
      },
    ],
  },
  {
    section: 'Level System',
    items: [
      {
        question: 'How does the level system work?',
        answer:
           'There are four levels: Onboarded → Mobilizer → Problem Solver → Leadership. As you complete hours and milestones, you progress through the ranks and unlock new responsibilities.',
      },
      {
        question: 'What do I need to level up?',
        answer:
          'Each level has specific requirements — a minimum number of logged hours, participation in training sessions, and demonstrated leadership. You can track your progress on your profile dashboard.',
      },
    ],
  },
  {
    section: 'Organizations',
    items: [
      {
        question: 'How can my NGO register?',
        answer:
          'Visit our Register Organization page and fill out the form. Our team will review your application and get back to you within 3–5 business days.',
      },
      {
        question: 'Is there a cost for organizations?',
        answer:
          'No. WeTheYuva is free for registered NGOs. We believe in removing barriers between volunteers and the causes that need them.',
      },
    ],
  },
];

export const generateMetadata = (): Metadata => ({
  title: 'Frequently Asked Questions | WeTheYuva',
  description:
    'Find answers to common questions about volunteering with WeTheYuva, how the level system works, and how organizations can join.',
});

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqData.flatMap((section) =>
    section.items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    }))
  ),
};

function AccordionItem({ question, children }: { question: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-2xl border border-brand-border bg-brand-surface [&:not(:last-child)]:mb-3">
      <summary className="flex items-center justify-between p-5 cursor-pointer font-heading font-medium text-brand-text list-none [&::-webkit-details-marker]:hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary focus-visible:outline-none rounded-2xl">
        {question}
        <ChevronDown
          className="h-4 w-4 text-brand-muted shrink-0 transition-transform duration-200 group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="px-5 pb-5 text-sm text-brand-muted leading-relaxed">{children}</div>
    </details>
  );
}

export default function FAQPage() {
  return (
    <>
      <script type="application/ld+json" suppressHydrationWarning>
        {JSON.stringify(jsonLd)}
      </script>
      <div className="min-h-dvh bg-brand-bg">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="text-center mb-12">
            <h1 className="font-heading font-bold text-3xl sm:text-4xl text-brand-text">
              Frequently Asked Questions
            </h1>
            <p className="mt-3 text-brand-muted max-w-xl mx-auto">
              Everything you need to know about volunteering with WeTheYuva. Can&apos;t find what
              you&apos;re looking for?{' '}
              <a
                href="mailto:support@wetheyuva.org"
                className="text-brand-primary hover:underline focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none rounded"
              >
                Reach out to us
              </a>
              .
            </p>
          </div>

          <div className="space-y-10">
            {faqData.map((section) => (
              <section key={section.section}>
                <h2 className="font-heading font-semibold text-xl text-brand-text mb-4">
                  {section.section}
                </h2>
                {section.items.map((item) => (
                  <AccordionItem key={item.question} question={item.question}>
                    {item.answer}
                  </AccordionItem>
                ))}
              </section>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
