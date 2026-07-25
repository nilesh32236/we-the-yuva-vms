'use client';

import { Button } from '@/components/ui/Button';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'destructive' | 'primary';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'destructive',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useFocusTrap(open);

  if (!open) return null;

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onCancel();
      }}
    >
      <div className="bg-brand-surface rounded-2xl shadow-xl w-full max-w-sm">
        <div className="px-6 py-5 space-y-2">
          <h2 id="confirm-title" className="font-heading font-bold text-lg text-brand-text">
            {title}
          </h2>
          <p className="text-sm text-brand-muted">{message}</p>
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            autoFocus
            className="flex-1"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant}
            onClick={onConfirm}
            loading={loading}
            className="flex-1"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
