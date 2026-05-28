const CONFIG = {
  PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  ACCEPTED: { label: 'Accepted', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  REJECTED: { label: 'Rejected', className: 'bg-red-100 text-red-800 border-red-200' },
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
