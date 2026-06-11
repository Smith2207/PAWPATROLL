/**
 * Dominio mascotas (fichas, estados, validación): validacion.
 */
import {
  MAX_BYTES_DATA_URL_IMAGEN,
  validarDataUrlImagen,
} from "@/lib/imagen/validar-archivo";
import { TIPOS_MASCOTA } from "@/lib/mascotas/tipos";

const MAX_FOTOS = 5;

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
  if (!TIPOS_MASCOTA.includes(tipo as (typeof TIPOS_MASCOTA)[number])) {
    return { ok: false as const, error: "Solo se permiten perros y gatos." };
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
    const validacion = validarDataUrlImagen(url);
    if (!validacion.ok) return validacion;
    if (url.length > MAX_BYTES_DATA_URL_IMAGEN) {
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
