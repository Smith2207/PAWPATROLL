/** Formatos de imagen aceptados en subidas de usuario */
const MIME_IMAGENES_PERMITIDOS = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const EXTENSIONES_IMAGEN_PERMITIDAS = [".jpg", ".jpeg", ".png", ".webp"];

export const ACCEPT_INPUT_IMAGEN =
  "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

export const MENSAJE_FORMATO_IMAGEN =
  "Solo se permiten imágenes JPG, PNG o WebP. Sube otra foto.";

export const MENSAJE_IMAGEN_ILEGIBLE =
  "No se pudo leer la imagen. Sube otra foto.";

export function mensajeTamanoImagen(maxMb: number): string {
  return `La imagen no puede superar ${maxMb} MB. Elige otra más liviana.`;
}

function extensionDeArchivo(nombre: string): string {
  const i = nombre.lastIndexOf(".");
  return i >= 0 ? nombre.slice(i).toLowerCase() : "";
}

export function mimeImagenPermitido(mime: string, nombreArchivo = ""): boolean {
  const tipo = mime.toLowerCase().split(";")[0].trim();
  if (MIME_IMAGENES_PERMITIDOS.has(tipo)) return true;
  if (tipo && tipo !== "application/octet-stream") return false;
  const ext = extensionDeArchivo(nombreArchivo);
  return EXTENSIONES_IMAGEN_PERMITIDAS.includes(ext);
}

export function validarArchivoImagen(
  archivo: File,
  opciones?: { maxBytes?: number }
): { ok: true } | { ok: false; error: string } {
  if (!mimeImagenPermitido(archivo.type, archivo.name)) {
    return { ok: false, error: MENSAJE_FORMATO_IMAGEN };
  }
  if (opciones?.maxBytes != null && archivo.size > opciones.maxBytes) {
    const maxMb = Math.max(1, Math.round(opciones.maxBytes / (1024 * 1024)));
    return { ok: false, error: mensajeTamanoImagen(maxMb) };
  }
  return { ok: true };
}

export function validarDataUrlImagen(
  dataUrl: string
): { ok: true } | { ok: false; error: string } {
  if (!dataUrl.startsWith("data:image/")) {
    return { ok: false, error: MENSAJE_FORMATO_IMAGEN };
  }
  const finMime = dataUrl.indexOf(";");
  const mime =
    finMime > 5 ? dataUrl.slice(5, finMime).toLowerCase() : dataUrl.slice(5).toLowerCase();
  if (!mimeImagenPermitido(mime)) {
    return { ok: false, error: MENSAJE_FORMATO_IMAGEN };
  }
  return { ok: true };
}
