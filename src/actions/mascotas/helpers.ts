/**
 * Server Actions (mascotas › helpers): operaciones de servidor invocadas desde la UI.
 */
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { mascotaFotos, mascotas, type DatosFichaMascota } from "@/lib/db/schema";
import { TIPOS_MASCOTA } from "@/lib/mascotas/tipos";

export function indexarClipMascota(mascotaId: string) {
  void import("@/lib/visual/indice-visual").then((m) =>
    m.sincronizarEmbeddingMascota(mascotaId)
  );
}

export function soloPerrosYGatos() {
  return inArray(mascotas.tipo, [...TIPOS_MASCOTA]);
}

export function normalizarFicha(datos: DatosFichaMascota) {
  return {
    nombre: datos.nombre.trim(),
    tipo: datos.tipo.trim(),
    raza: datos.raza?.trim() || null,
    sexo: datos.sexo?.trim() || null,
    color: datos.color?.trim() || null,
    tamano: datos.tamano?.trim() || null,
    edad: datos.edad?.trim() || null,
    peso: datos.peso?.trim() || null,
    descripcion: datos.descripcion?.trim() || null,
    senasParticulares: datos.senasParticulares?.trim() || null,
    collar: datos.collar?.trim() || null,
    microchip: datos.microchip?.trim() || null,
    contactoPublico: datos.contactoPublico?.trim() || null,
    enfermedades: datos.enfermedades?.trim() || null,
    accesoExterior: datos.accesoExterior?.trim() || null,
  };
}

export async function guardarFotos(mascotaId: string, fotos: string[]) {
  if (fotos.length === 0) return;

  const { normalizarFotosMascota } = await import("@/lib/storage/blob-mascota");
  const urls = await normalizarFotosMascota(mascotaId, fotos);

  await db.insert(mascotaFotos).values(
    urls.map((url, i) => ({
      mascotaId,
      url,
      esPrincipal: i === 0,
      orden: i,
    }))
  );
}

export async function reemplazarFotos(mascotaId: string, fotos: string[]) {
  await db.delete(mascotaFotos).where(eq(mascotaFotos.mascotaId, mascotaId));
  await guardarFotos(mascotaId, fotos);
}

export function revalidarRutasMascota(id: string, slug: string) {
  revalidatePath("/mis-mascotas");
  revalidatePath(`/mis-mascotas/${id}`);
  revalidatePath(`/mascota/${slug}`);
  revalidatePath("/");
}

export async function adjuntarFotoPrincipal<T extends { id: string }>(
  lista: T[]
): Promise<(T & { fotoPrincipal: string | null })[]> {
  if (lista.length === 0) return [];

  const ids = lista.map((m) => m.id);
  const fotos = await db
    .select()
    .from(mascotaFotos)
    .where(inArray(mascotaFotos.mascotaId, ids))
    .orderBy(mascotaFotos.orden);

  const fotoMap = new Map<string, string>();
  for (const f of fotos) {
    if (!fotoMap.has(f.mascotaId)) fotoMap.set(f.mascotaId, f.url);
  }

  return lista.map((m) => ({
    ...m,
    fotoPrincipal: fotoMap.get(m.id) ?? null,
  }));
}
