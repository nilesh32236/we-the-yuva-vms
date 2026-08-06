import { ShieldX } from 'lucide-react';

export function Unauthorized() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <ShieldX className="w-10 h-10 text-brand-muted/40" />
      <p className="text-sm font-medium text-brand-text">You don&apos;t have permission to do this.</p>
      <p className="text-xs text-brand-muted">Contact an administrator if you think this is a mistake.</p>
    </div>
  );
}