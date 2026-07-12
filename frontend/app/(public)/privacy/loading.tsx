export default function PrivacyLoading() {
  return (
    <div
      className="min-h-dvh bg-brand-bg flex items-center justify-center"
      role="status"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-brand-primary/20 animate-pulse flex items-center justify-center">
          <div className="w-5 h-5 rounded-md bg-brand-primary/40" />
        </div>
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}
