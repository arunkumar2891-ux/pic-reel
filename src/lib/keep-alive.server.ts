/**
 * Self-ping keep-alive: prevents Render.com free-tier services from spinning
 * down due to inactivity (which happens after ~15 minutes without a request).
 *
 * Derives its own URL from the incoming request so it works across all
 * environments (local dev, staging, production) without any env-var setup.
 */

const PING_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

let timer: ReturnType<typeof setInterval> | null = null;
let origin: string | null = null;

export function startKeepAlive(requestOrigin: string): void {
  if (timer !== null) return; // already running

  origin = requestOrigin;
  console.log(`[keep-alive] starting — will ping ${origin}/api/health every 5 min`);

  timer = setInterval(async () => {
    try {
      const res = await fetch(`${origin}/api/health`, { method: "GET" });
      console.log(`[keep-alive] ping → ${res.status}`);
    } catch (err) {
      console.warn("[keep-alive] ping failed:", (err as Error).message);
    }
  }, PING_INTERVAL_MS);

  // Don't block Node/Bun process exit
  if (typeof timer === "object" && timer !== null && "unref" in timer) {
    (timer as { unref(): void }).unref();
  }
}
