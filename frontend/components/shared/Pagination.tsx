'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
}

export default function Pagination({ page, totalPages, setPage }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-center gap-2 mt-6" aria-label="Pagination">
      <button
        type="button"
        onClick={() => setPage(Math.max(1, page - 1))}
        disabled={page === 1}
        className="px-4 py-3 rounded-xl border border-brand-border text-sm font-medium text-brand-muted disabled:opacity-40 hover:bg-brand-bg cursor-pointer transition-colors active-bounce card-hover min-h-[44px] focus-visible:ring-2 focus-visible:ring-brand-primary"
      >
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        Previous
      </button>
      <span className="text-sm text-brand-muted">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        onClick={() => setPage(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="px-4 py-3 rounded-xl border border-brand-border text-sm font-medium text-brand-muted disabled:opacity-40 hover:bg-brand-bg cursor-pointer transition-colors active-bounce card-hover min-h-[44px] focus-visible:ring-2 focus-visible:ring-brand-primary"
      >
        Next
        <ChevronRight className="w-4 h-4" aria-hidden="true" />
      </button>
    </nav>
  );
}
