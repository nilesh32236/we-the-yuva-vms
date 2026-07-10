'use client';

import { Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
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
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
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
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-brand-border text-sm font-medium text-brand-muted hover:bg-brand-bg bg-background cursor-pointer transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-colors disabled:opacity-60 flex items-center justify-center gap-2 ${
              variant === 'danger'
                ? 'bg-brand-error text-white hover:bg-red-700'
                : 'bg-brand-primary text-white hover:bg-brand-secondary'
            }`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
