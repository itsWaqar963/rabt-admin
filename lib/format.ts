/** Relative time from ISO / Date; empty if missing. */
export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const diff = Date.now() - t;
  const sec = Math.round(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 48) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 60) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function shortId(id: string | null | undefined, n = 8): string {
  if (!id) return "—";
  return id.length <= n ? id : `${id.slice(0, n)}…`;
}

export function truncate(text: string | null | undefined, max = 80): string {
  if (!text) return "—";
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}
