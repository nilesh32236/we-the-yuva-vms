const CONFIG = {
  PENDING: { label: 'Pending', className: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800' },
  ACCEPTED: { label: 'Accepted', className: 'bg-brand-primary/10 text-brand-primary border-brand-primary/20' },
  REJECTED: { label: 'Rejected', className: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800' },
} as const;

export function ApplicationStatusBadge({ status }: { status: keyof typeof CONFIG }) {
  const { label, className } = CONFIG[status] ?? CONFIG.PENDING;
  return (
    <span
      className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${className}`}
    >
      {label}
    </span>
  );
}
