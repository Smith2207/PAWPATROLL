/**
 * Autenticación y autorización: validacion-imagen.
 */
import {
  MAX_BYTES_DATA_URL_IMAGEN,
  validarDataUrlImagen,
} from "@/lib/imagen/validar-archivo";

export function validarImagenDataUrl(url: string | null) {
  if (url === null) {
    return { ok: true as const };
  }

  return validarDataUrlImagen(url, { maxBytes: MAX_BYTES_DATA_URL_IMAGEN });
}
