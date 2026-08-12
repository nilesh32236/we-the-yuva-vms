'use client';

import { useInView } from '@/hooks/useInView';

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  stagger?: boolean;
  threshold?: number;
}

export function Reveal({
  children,
  className = '',
  stagger = false,
  threshold = 0.1,
}: RevealProps) {
  const { ref, inView } = useInView(threshold);
  return (
    <div
      ref={ref}
      className={`${
        stagger
          ? `stagger-group ${inView ? 'in-view' : ''}`
          : `motion-safe:transition-opacity motion-safe:duration-700 ${inView ? 'opacity-100' : 'opacity-0'}`
      } ${className}`}
    >
      {children}
    </div>
  );
}