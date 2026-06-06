/** WebSocket local (instrumentation + puerto 3001). En producción hace falta NEXT_PUBLIC_WS_URL. */
export function webSocketDisponibleEnCliente(): boolean {
  if (typeof window === "undefined") return false;
  if (process.env.NEXT_PUBLIC_WS_URL?.trim()) return true;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}
