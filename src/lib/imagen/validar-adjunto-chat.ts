/**
 * Validación de adjuntos de chat (data URL o Vercel Blob).
 */
import { esAdjuntoChatValido } from "@/lib/storage/blob-chat";
import {
  MAX_BYTES_DATA_URL_IMAGEN,
  validarDataUrlImagen,
} from "@/lib/imagen/validar-archivo";

export function validarAdjuntoChat(
  url: string
): { ok: true } | { ok: false; error: string } {
  const u = url.trim();
  if (!esAdjuntoChatValido(u)) {
    return { ok: false, error: "Solo se permiten imágenes como adjunto." };
  }
  if (u.startsWith("data:image/")) {
    return validarDataUrlImagen(u, { maxBytes: MAX_BYTES_DATA_URL_IMAGEN });
  }
  return { ok: true };
}
