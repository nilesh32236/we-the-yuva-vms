export default function OfflineLoading() {
  return (
    <div className="min-h-dvh bg-brand-bg flex items-center justify-center" role="status" aria-busy="true">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
    </div>
  );
}
