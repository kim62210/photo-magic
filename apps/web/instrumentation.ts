export async function register() {
  // Server-side Sentry init happens here when @sentry/nextjs is installed.
  // For now (static export build), this is a no-op so the build stays
  // dependency-free.
  return;
}

export async function onRequestError(_err: unknown, _request: Request) {
  // No-op until @sentry/nextjs is added for the server runtime path.
  return;
}
