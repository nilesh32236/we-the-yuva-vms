import { z } from 'zod';
import { ApplicationStatusSchema } from '@/lib/shared';

const CONFIG = {
  PENDING: {
    label: 'Pending',
    className: 'bg-brand-accent/10 text-brand-accent border-brand-accent/20',
  },
  ACCEPTED: {
    label: 'Accepted',
    className: 'bg-brand-primary/10 text-brand-primary border-brand-primary/20',
  },
  REJECTED: {
    label: 'Rejected',
    className: 'bg-brand-error/10 text-brand-error border-brand-error/20',
  },
  WITHDRAWN: {
    label: 'Withdrawn',
    className: 'bg-brand-muted/10 text-brand-muted border-brand-muted/20',
  },
} as const;

type ApplicationStatus = z.infer<typeof ApplicationStatusSchema>['status'];

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  const { label, className } = CONFIG[status] ?? CONFIG.PENDING;
  return (
    <span
      className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${className}`}
    >
      {label}
    </span>
  );
}
