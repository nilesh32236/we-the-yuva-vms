'use client';

import { useMutation } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CheckCircle, Keyboard, QrCode, XCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { api } from '@/lib/api';
import { haptic } from '@/lib/haptic';
import { Button } from '@/components/ui/Button';

const ManualTokenSchema = z.object({
  token: z.string().min(1, 'Please enter a check-in code'),
});
type ManualTokenInput = z.infer<typeof ManualTokenSchema>;

function ScanInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    register: registerToken,
    handleSubmit: handleTokenSubmit,
    formState: { errors: tokenErrors },
  } = useForm<ManualTokenInput>({
    resolver: zodResolver(ManualTokenSchema),
  });
  const [result, setResult] = useState<'success' | 'error' | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [mode, setMode] = useState<'camera' | 'manual'>('camera');
  const [scannerReady, setScannerReady] = useState(false);

  const token = searchParams.get('token');
  const eventId = searchParams.get('eventId');
  const submitted = useRef(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainer = useRef<HTMLDivElement>(null);

  const checkinMutation = useMutation({
    mutationFn: (qrToken: string) =>
      api.post(`/events/${eventId}/checkin`, { qrToken }).then((r) => r.data),
    onSuccess: () => {
      haptic.success();
      setResult('success');
      setTimeout(() => router.push('/volunteer/events'), 2000);
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      haptic.error();
      setResult('error');
      setErrorMsg(err.response?.data?.error ?? 'Check-in failed');
    },
  });

  const doCheckin = useCallback(
    (qrToken: string) => {
      if (!eventId) {
        setErrorMsg('Missing event ID');
        return;
      }
      checkinMutation.mutate(qrToken);
    },
    [eventId, checkinMutation]
  );

  // Auto-submit from URL params
  useEffect(() => {
    if (submitted.current) return;
    if (token && eventId) {
      submitted.current = true;
      doCheckin(token);
    }
  }, [token, eventId, doCheckin]);

  // Camera scanner lifecycle
  useEffect(() => {
    if (mode !== 'camera') return;
    if (!scannerContainer.current) return;
    if (result) return;

    const scanner = new Html5Qrcode('qr-scanner-container');
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Extract token from URL if it's a full URL, otherwise use raw text
          const qrToken = decodedText;
          try {
            const url = new URL(decodedText);
            const t = url.searchParams.get('token');
            const eid = url.searchParams.get('eventId');
            if (t && eid) {
              scanner.stop().catch(() => {});
              scannerRef.current = null;
              if (eid === eventId || !eventId) {
                doCheckin(t);
              } else {
                setErrorMsg('This QR code is for a different event');
              }
              return;
            }
          } catch {
            // Not a URL, treat raw text as token
          }
          scanner.stop().catch(() => {});
          scannerRef.current = null;
          doCheckin(qrToken);
        },
        () => {
          // QR scan failed frame - ignore, keep scanning
        }
      )
      .then(() => setScannerReady(true))
      .catch((_err) => {
        setErrorMsg('Camera access denied or unavailable. Switch to manual entry.');
        setMode('manual');
      });

    return () => {
      scanner.stop().catch(() => {});
      scannerRef.current = null;
      setScannerReady(false);
    };
  }, [mode, result, doCheckin, eventId]);

  const onManualSubmit = (data: ManualTokenInput) => {
    if (!eventId) {
      setErrorMsg('Missing event ID. Scan the QR code from your event page.');
      return;
    }
    setErrorMsg('');
    haptic.medium();
    doCheckin(data.token.trim());
  };

  // Auto-redirect from URL params
  if (token && eventId) {
    return (
      <main id="main" className="max-w-md mx-auto mt-20 text-center space-y-6 px-4">
        <div aria-live="polite">
          {checkinMutation.isPending ? (
            <div className="space-y-4">
              <div className="w-16 h-16 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin mx-auto" />
              <p className="text-brand-muted">Processing check-in...</p>
            </div>
          ) : result === 'success' ? (
            <div className="space-y-4">
              <CheckCircle className="w-16 h-16 text-brand-primary mx-auto" />
              <h2 className="font-heading font-bold text-xl text-brand-text">Checked In!</h2>
              <p className="text-brand-muted">Redirecting to your events...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <XCircle className="w-16 h-16 text-brand-error mx-auto" />
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
      </main>
    );
  }

  return (
    <main id="main" className="max-w-md mx-auto mt-8 space-y-6 px-4">
      <div className="text-center space-y-2">
        <QrCode className="w-10 h-10 text-brand mx-auto" />
        <h1 className="font-heading font-bold text-xl text-brand-text">Event Check-in</h1>
        <p className="text-sm text-brand-muted">
          {mode === 'camera'
            ? 'Point your camera at the event QR code'
            : 'Enter the check-in code from your event'}
        </p>
      </div>

      {errorMsg && (
        <div
          className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl p-4 text-sm text-red-600 dark:text-red-400"
          role="alert"
        >
          {errorMsg}
        </div>
      )}

      {result === 'success' ? (
        <div className="text-center space-y-4 py-8">
          <CheckCircle className="w-16 h-16 text-brand-primary mx-auto" />
          <h2 className="font-heading font-bold text-xl text-brand-text">Checked In!</h2>
        </div>
      ) : (
        <>
          {/* Mode toggle */}
          <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-1" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'camera'}
              aria-controls="scan-camera-panel"
              onClick={() => {
                setMode('camera');
                setErrorMsg('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                mode === 'camera'
                  ? 'bg-brand-surface shadow-sm text-brand-primary'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Camera className="w-4 h-4" /> Camera
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'manual'}
              aria-controls="scan-manual-panel"
              onClick={() => {
                setMode('manual');
                setErrorMsg('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                mode === 'manual'
                  ? 'bg-brand-surface shadow-sm text-brand-primary'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Keyboard className="w-4 h-4" /> Manual
            </button>
          </div>

          {/* Camera scanner */}
          {mode === 'camera' && (
            <div
              id="scan-camera-panel"
              role="tabpanel"
              className="bg-brand-surface rounded-2xl border border-brand-border overflow-hidden"
            >
              <div
                id="qr-scanner-container"
                ref={scannerContainer}
                className="w-full aspect-square bg-black"
              />
              {!scannerReady && (
                <div className="text-center py-4 text-sm text-brand-muted" aria-live="polite">
                  Starting camera...
                </div>
              )}
            </div>
          )}

          {/* Manual entry */}
          {mode === 'manual' && (
            <div
              id="scan-manual-panel"
              role="tabpanel"
              className="bg-brand-surface rounded-2xl border border-brand-border p-6 space-y-4"
            >
              <form onSubmit={handleTokenSubmit(onManualSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="token" className="text-sm font-medium text-brand-text">
                    Check-in Code
                  </label>
                  <input
                    id="token"
                    type="text"
                    {...registerToken('token')}
                    disabled={checkinMutation.isPending}
                    aria-invalid={!!tokenErrors.token}
                    placeholder="Paste or type the check-in code"
                    className={`w-full px-4 py-3 rounded-xl bg-background border text-base focus:outline-none focus:ring-2 focus:ring-brand-primary/40 ${tokenErrors.token ? 'border-brand-error' : 'border-brand-border'}`}
                  />
                  {tokenErrors.token && (
                    <p className="text-xs text-brand-error" role="alert">
                      {tokenErrors.token.message}
                    </p>
                  )}
                </div>
                <Button type="submit" loading={checkinMutation.isPending} className="w-full">
                  Check In
                </Button>
              </form>
            </div>
          )}
        </>
      )}
    </main>
  );
}

export default function ScanPage() {
  return (
    <Suspense
      fallback={<div className="text-center text-brand-muted py-8">Loading scan page...</div>}
    >
      <ScanInner />
    </Suspense>
  );
}
