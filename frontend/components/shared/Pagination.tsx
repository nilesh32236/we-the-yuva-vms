'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PaginationProps {
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
}

export function Pagination({ page, totalPages, setPage }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-center gap-2 mt-6" aria-label="Pagination">
      <Button
        type="button"
        variant="outline"
        onClick={() => setPage(Math.max(1, page - 1))}
        disabled={page === 1}
        className="px-4 py-3 rounded-xl text-sm font-medium active-bounce card-hover"
      >
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        Previous
      </Button>
      <span className="text-sm text-brand-muted">
        Page {page} of {totalPages}
      </span>
      <Button
        type="button"
        variant="outline"
        onClick={() => setPage(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="px-4 py-3 rounded-xl text-sm font-medium active-bounce card-hover"
      >
        Next
        <ChevronRight className="w-4 h-4" aria-hidden="true" />
      </Button>
    </nav>
  );
}
