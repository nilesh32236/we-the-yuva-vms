'use client';

import { useMutation } from '@tanstack/react-query';
import { Camera, CheckCircle, XCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

function ScanInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [manualToken, setManualToken] = useState('');
  const [result, setResult] = useState<'success' | 'error' | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const token = searchParams.get('token');
  const eventId = searchParams.get('eventId');

  const submitted = useRef(false);

  const checkinMutation = useMutation({
    mutationFn: (qrToken: string) =>
      api.post(`/events/${eventId}/checkin`, { qrToken }).then((r) => r.data),
    onSuccess: () => {
      setResult('success');
      setTimeout(() => router.push('/volunteer/events'), 2000);
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      setResult('error');
      setErrorMsg(err.response?.data?.error ?? 'Check-in failed');
    },
  });

  const handleManualSubmit = () => {
    if (!eventId) { setErrorMsg('Missing event ID. Scan the QR code from your event page.'); return; }
    if (!manualToken.trim()) {
      setErrorMsg('Please enter a check-in code');
      return;
    }
    setErrorMsg('');
    checkinMutation.mutate(manualToken.trim());
  };

  useEffect(() => {
    if (submitted.current) return;
    if (token && eventId) {
      submitted.current = true;
      checkinMutation.mutate(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, eventId, checkinMutation.mutate]);

  if (token && eventId) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center space-y-6">
        <div aria-live="polite">
          {checkinMutation.isPending ? (
            <div className="space-y-4">
              <div className="w-16 h-16 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin mx-auto" />
              <p className="text-brand-muted">Processing check-in...</p>
            </div>
          ) : result === 'success' ? (
            <div className="space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <h2 className="font-heading font-bold text-xl text-brand-text">Checked In!</h2>
              <p className="text-brand-muted">Redirecting to your events...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <XCircle className="w-16 h-16 text-red-500 mx-auto" />
              <h2 className="font-heading font-bold text-xl text-brand-text">Check-in Failed</h2>
              <p className="text-brand-muted">{errorMsg}</p>
              <button
                type="button"
                onClick={() => router.push('/volunteer/events')}
                className="text-brand-primary hover:underline text-sm cursor-pointer"
              >
                Back to Events
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-12 space-y-6">
      <div className="text-center space-y-2">
        <Camera className="w-10 h-10 text-brand-primary mx-auto" />
        <h1 className="font-heading font-bold text-xl text-brand-text">Event Check-in</h1>
        <p className="text-sm text-brand-muted">Enter the check-in code from your event QR code</p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-brand-border p-6 space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="token" className="text-sm font-medium text-brand-text">
            Check-in Code
          </label>
          <input
            id="token"
            type="text"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleManualSubmit();
            }}
            placeholder="Paste or type the check-in code"
            className="w-full px-4 py-3 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </div>
        <button
          type="button"
          onClick={handleManualSubmit}
          disabled={checkinMutation.isPending}
          className="w-full bg-brand-primary text-white font-medium py-3 rounded-xl hover:bg-brand-secondary transition-colors disabled:opacity-60 cursor-pointer"
        >
          {checkinMutation.isPending ? 'Checking in...' : 'Check In'}
        </button>
      </div>
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense fallback={<div className="text-center text-brand-muted py-8">Loading scan page...</div>}>
      <ScanInner />
    </Suspense>
  );
}
