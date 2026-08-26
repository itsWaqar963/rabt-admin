/**
 * Canonical admin origin (no trailing slash).
 * Client: window.location.origin (keeps magic-link redirects on admin host).
 * Server: APP_URL, then https://VERCEL_URL, then optional request origin.
 * APP_URL is private (not NEXT_PUBLIC_*) so it is not forced into the client bundle.
 */
export function getAppOrigin(requestOrigin?: string): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  const fromEnv = process.env.APP_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  const vercelHost = process.env.VERCEL_URL?.trim().replace(/\/$/, "");
  if (vercelHost) return `https://${vercelHost}`;

  if (requestOrigin) return requestOrigin.replace(/\/$/, "");
  return "";
}

/** Same-origin path only — blocks open redirects. */
export function safeNextPath(
  next: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("://")) {
    return fallback;
  }
  return next;
}
