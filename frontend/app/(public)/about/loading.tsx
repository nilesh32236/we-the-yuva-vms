export default function AboutLoading() {
  return (
    <div className="min-h-dvh bg-brand-bg flex items-center justify-center" role="status" aria-busy="true" aria-label="Loading about page">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
