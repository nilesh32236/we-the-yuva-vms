'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  setPage: (fn: (prev: number) => number) => void;
}

export default function Pagination({ page, totalPages, setPage }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        type="button"
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        disabled={page === 1}
        className="px-4 py-2 rounded-xl border border-brand-border text-sm font-medium text-brand-muted disabled:opacity-40 hover:bg-brand-bg cursor-pointer transition-colors active-bounce card-hover"
      >
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        Previous
      </button>
      <span className="text-sm text-brand-muted">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        disabled={page === totalPages}
        className="px-4 py-2 rounded-xl border border-brand-border text-sm font-medium text-brand-muted disabled:opacity-40 hover:bg-brand-bg cursor-pointer transition-colors active-bounce card-hover"
      >
        Next
        <ChevronRight className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}
