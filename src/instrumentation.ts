/**
 * Instrumentation Next.js: arranca el servidor WebSocket en desarrollo.
 */
export async function register() {
  if (process.env.VERCEL || process.env.VERCEL_ENV) return;
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { iniciarServidorWebSocket } = await import(
      "@/lib/tiempo-real/servidor-ws"
    );
    iniciarServidorWebSocket();
  }
}
