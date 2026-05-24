const MAX_DATA_URL_BYTES = 900_000;

export function validarImagenDataUrl(url: string | null) {
  if (url === null) {
    return { ok: true as const };
  }

  if (!url.startsWith("data:image/")) {
    return { ok: false as const, error: "Formato de imagen no válido." };
  }

  if (url.length > MAX_DATA_URL_BYTES) {
    return {
      ok: false as const,
      error: "La imagen es demasiado pesada. Usa una más pequeña.",
    };
  }

  return { ok: true as const };
}
