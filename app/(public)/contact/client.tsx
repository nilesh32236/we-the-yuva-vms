'use client';

import { useState, type FormEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

const SUBJECTS = [
  'General Inquiry',
  'Partnership',
  'Volunteer Support',
  'Media',
  'Other',
] as const;

export function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name || !email || !subject || !message) return;

    setLoading(true);
    try {
      await api.post('/contact', { name, email, subject, message });
      toast({
        title: 'Message sent!',
        description: "We'll get back to you within 48 hours.",
      });
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch {
      toast({
        title: 'Something went wrong',
        description: 'Could not send your message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-brand-text">
          Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-xl border border-brand-border p-3 bg-background text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none"
          placeholder="Your name"
        />
      </div>

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-brand-text">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-xl border border-brand-border p-3 bg-background text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="subject" className="mb-1.5 block text-sm font-medium text-brand-text">
          Subject
        </label>
        <select
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          className="w-full rounded-xl border border-brand-border p-3 bg-background text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none"
        >
          <option value="" disabled>
            Select a subject
          </option>
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-brand-text">
          Message
        </label>
        <textarea
          id="message"
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          className="w-full rounded-xl border border-brand-border p-3 bg-background text-sm text-brand-text placeholder:text-brand-muted resize-y focus:outline-none focus:ring-2 focus:ring-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none"
          placeholder="Tell us what's on your mind..."
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl bg-brand-primary text-white px-6 py-3 font-semibold hover:bg-brand-secondary transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Send className="h-4 w-4" aria-hidden="true" />
        )}
        {loading ? 'Sending...' : 'Send message'}
      </button>
    </form>
  );
}
