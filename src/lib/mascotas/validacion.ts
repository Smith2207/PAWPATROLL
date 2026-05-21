const MAX_FOTOS = 5;
const MAX_DATA_URL_BYTES = 900_000;

export function validarDatosMascota(datos: {
  nombre: string;
  tipo: string;
}) {
  const nombre = datos.nombre.trim();
  const tipo = datos.tipo.trim();

  if (!nombre || nombre.length < 2) {
    return { ok: false as const, error: "El nombre debe tener al menos 2 caracteres." };
  }
  if (!tipo) {
    return { ok: false as const, error: "Selecciona el tipo de mascota." };
  }

  return { ok: true as const, nombre, tipo };
}

export function validarFotosDataUrl(fotos: string[]) {
  if (fotos.length > MAX_FOTOS) {
    return {
      ok: false as const,
      error: `Máximo ${MAX_FOTOS} fotos por mascota.`,
    };
  }

  for (const url of fotos) {
    if (!url.startsWith("data:image/")) {
      return { ok: false as const, error: "Formato de imagen no válido." };
    }
    if (url.length > MAX_DATA_URL_BYTES) {
      return {
        ok: false as const,
        error: "Alguna imagen es demasiado pesada. Usa fotos más pequeñas.",
      };
    }
  }

  return { ok: true as const };
}

export function generarSlugMascota(nombre: string) {
  const base = nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const sufijo = crypto.randomUUID().slice(0, 8);
  return `${base || "mascota"}-${sufijo}`;
}
