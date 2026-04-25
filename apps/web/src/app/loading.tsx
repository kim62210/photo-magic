export default function Loading() {
  return (
    <div className="route-loading" aria-live="polite" aria-busy="true">
      <span className="route-loading__pulse" aria-hidden />
      <span className="route-loading__label">불러오는 중…</span>
    </div>
  );
}
