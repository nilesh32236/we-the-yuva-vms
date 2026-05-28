'use client';

import { useMutation } from '@tanstack/react-query';
import { Camera, CheckCircle, XCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

function ScanInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const streamRef = useRef<MediaStream | null>(null);

  const token = searchParams.get('token');
  const eventId = searchParams.get('eventId');

  const checkinMutation = useMutation({
    mutationFn: (qrToken: string) =>
      api.post(`/events/${eventId}/checkin`, { qrToken }).then((r) => r.data),
    onSuccess: () => {
      setResult('success');
      stopCamera();
      setTimeout(() => router.push('/volunteer/events'), 2000);
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      setResult('error');
      setErrorMsg(err.response?.data?.error ?? 'Check-in failed');
      stopCamera();
    },
  });

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setScanning(true);
    } catch {
      setErrorMsg('Camera access denied. Please allow camera permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    if (token && eventId) {
      checkinMutation.mutate(token);
    }
    return () => stopCamera();
  }, []);

  if (token && eventId) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center space-y-6">
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
              onClick={() => router.push('/volunteer/events')}
              className="text-brand-primary hover:underline text-sm cursor-pointer"
            >
              Back to Events
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-12 space-y-6">
      <div className="text-center space-y-2">
        <Camera className="w-10 h-10 text-brand-primary mx-auto" />
        <h1 className="font-heading font-bold text-xl text-brand-text">Scan QR Code</h1>
        <p className="text-sm text-brand-muted">
          Point your camera at the event QR code to check in
        </p>
      </div>

      {errorMsg && !scanning && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <div className="bg-black rounded-2xl overflow-hidden aspect-[3/4] flex items-center justify-center relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
        {!scanning && (
          <button
            onClick={startCamera}
            className="z-10 bg-white px-6 py-3 rounded-xl font-medium text-brand-text shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
          >
            Start Camera
          </button>
        )}
        {scanning && (
          <div className="absolute inset-0 border-[3px] border-brand-primary/60 rounded-2xl m-8" />
        )}
      </div>

      <p className="text-xs text-brand-muted text-center">
        Position the QR code within the frame to auto-scan
      </p>
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense>
      <ScanInner />
    </Suspense>
  );
}
