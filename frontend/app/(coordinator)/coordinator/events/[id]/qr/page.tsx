'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, QrCode, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { QRCodeCanvas } from 'qrcode.react';
import { use } from 'react';
import { haptic } from '@/lib/haptic';
import { api } from '@/lib/api';

export default function EventQrPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['event-qr', id],
    queryFn: () => api.get(`/events/${id}/qr`).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const checkInUrl = data
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/scan?token=${data.token}&eventId=${id}`
    : '';

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Link
        href={`/coordinator/events/${id}/attendance`}
        className="inline-flex items-center gap-1.5 text-sm text-brand-primary hover:underline active-bounce"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back to Attendance
      </Link>

      <div className="bg-brand-surface rounded-2xl border border-brand-border p-8 text-center space-y-6 card-hover">
        <div className="flex items-center justify-center gap-2">
          <QrCode className="w-5 h-5 text-brand-primary" aria-hidden="true" />
          <h1 className="font-heading font-bold text-xl text-brand-text">Event QR Code</h1>
        </div>

        {isLoading ? (
          <div
            className="flex items-center justify-center py-12"
            role="status"
            aria-label="Loading QR code"
          >
            <div className="w-10 h-10 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
          </div>
        ) : data ? (
          <>
            <div className="bg-brand-surface p-4 rounded-xl inline-block shadow-sm border border-brand-border">
              <QRCodeCanvas value={checkInUrl} size={220} level="M" />
            </div>

            <div className="space-y-1">
              <p className="font-medium text-brand-text">{data.eventTitle}</p>
              <p className="text-sm text-brand-muted">
                {new Date(data.eventDate).toLocaleDateString('en-IN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              {data.expiresAt && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Expires{' '}
                  {new Date(data.expiresAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                haptic.medium();
                refetch();
              }}
              className="inline-flex items-center gap-1.5 text-sm text-brand-primary hover:underline cursor-pointer active-bounce"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" /> Regenerate QR
            </button>

            <div className="bg-brand-bg rounded-xl p-4 text-left space-y-2">
              <p className="text-xs font-semibold text-brand-muted uppercase tracking-wide">
                Instructions
              </p>
              <ul className="text-sm text-brand-muted space-y-1 list-disc list-inside">
                <li>Display this QR code at the event entrance</li>
                <li>Volunteers scan using camera on their phone</li>
                <li>QR expires 24 hours after event date</li>
              </ul>
            </div>
          </>
        ) : (
          <p className="text-brand-muted">Could not load QR code</p>
        )}
      </div>
    </div>
  );
}
