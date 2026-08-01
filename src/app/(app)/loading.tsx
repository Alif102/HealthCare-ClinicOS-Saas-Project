export default function AppLoading() {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true" aria-live="polite">
      <div className="h-8 w-48 rounded-md bg-muted" />
      <div className="h-4 w-72 max-w-full rounded-md bg-muted/80" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-28 rounded-xl bg-muted/70" />
        <div className="h-28 rounded-xl bg-muted/70" />
        <div className="h-28 rounded-xl bg-muted/70" />
      </div>
      <div className="h-64 rounded-xl bg-muted/60" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
