/** URL pública del adjunto (sin base64 en respuestas al cliente). */
import { esUrlBlobChat } from "@/lib/storage/blob-chat";

export function urlAdjuntoMensaje(mensajeId: string): string {
  return `/api/chat/adjunto/${mensajeId}`;
}

export function esUrlAdjuntoMensaje(url: string | null | undefined): boolean {
  return Boolean(url?.startsWith("/api/chat/adjunto/"));
}

export function mensajeConAdjuntoApi<
  T extends { id: string; adjuntoUrl: string | null },
>(m: T): T {
  if (!m.adjuntoUrl?.trim()) return m;
  if (esUrlAdjuntoMensaje(m.adjuntoUrl)) return m;
  if (
    m.adjuntoUrl.startsWith("data:image/") ||
    esUrlBlobChat(m.adjuntoUrl)
  ) {
    return { ...m, adjuntoUrl: urlAdjuntoMensaje(m.id) };
  }
  return m;
}

export function mensajesConAdjuntoApi<
  T extends { id: string; adjuntoUrl: string | null },
>(mensajes: T[]): T[] {
  return mensajes.map(mensajeConAdjuntoApi);
}
