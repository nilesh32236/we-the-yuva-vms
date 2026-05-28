'use client';

import { RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '../ui/Button';

interface ResendButtonProps {
  onResend: () => Promise<void>;
  cooldownSeconds?: number;
}

export function ResendButton({ onResend, cooldownSeconds = 60 }: ResendButtonProps) {
  const [countdown, setCountdown] = useState(cooldownSeconds);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleResend = useCallback(async () => {
    if (countdown > 0 || isLoading) return;
    setIsLoading(true);
    try {
      await onResend();
      setCountdown(cooldownSeconds);
    } finally {
      setIsLoading(false);
    }
  }, [countdown, isLoading, onResend, cooldownSeconds]);

  return (
    <Button
      variant="ghost"
      onClick={handleResend}
      disabled={countdown > 0}
      loading={isLoading}
      className="inline-flex items-center gap-1.5 text-sm"
    >
      <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
      {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
    </Button>
  );
}
