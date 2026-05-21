"use server";

import { and, desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  historialEstadoMascota,
  mascotaFotos,
  mascotas,
  users,
  type DatosFichaMascota,
  type EstadoMascota,
} from "@/lib/db/schema";
import type { ResultadoAuth } from "@/actions/autenticacion";
import { TRANSICIONES_ESTADO, esFichaPublica } from "@/lib/mascotas/estados";
import {
  generarSlugMascota,
  validarDatosMascota,
  validarFotosDataUrl,
} from "@/lib/mascotas/validacion";

async function sesionUsuario() {
  const { auth } = await import("@/auth");
  const sesion = await auth();
  return sesion?.user?.id ?? null;
}

function normalizarFicha(datos: DatosFichaMascota) {
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
  };
}

async function registrarHistorial(
  mascotaId: string,
  estadoAnterior: EstadoMascota,
  estadoNuevo: EstadoMascota,
  userId: string | null,
  notas?: string
) {
  if (estadoAnterior === estadoNuevo) return;

  await db.insert(historialEstadoMascota).values({
    mascotaId,
    estadoAnterior,
    estadoNuevo,
    userId,
    notas: notas?.trim() || null,
  });
}

async function guardarFotos(mascotaId: string, fotos: string[]) {
  if (fotos.length === 0) return;

  await db.insert(mascotaFotos).values(
    fotos.map((url, i) => ({
      mascotaId,
      url,
      esPrincipal: i === 0,
      orden: i,
    }))
  );
}

async function reemplazarFotos(mascotaId: string, fotos: string[]) {
  await db.delete(mascotaFotos).where(eq(mascotaFotos.mascotaId, mascotaId));
  await guardarFotos(mascotaId, fotos);
}

function revalidarRutasMascota(id: string, slug: string) {
  revalidatePath("/mis-mascotas");
  revalidatePath(`/mis-mascotas/${id}`);
  revalidatePath(`/mascota/${slug}`);
  revalidatePath("/");
}

export async function listarMisMascotas() {
  const userId = await sesionUsuario();
  if (!userId) return [];

  const lista = await db
    .select()
    .from(mascotas)
    .where(eq(mascotas.userId, userId))
    .orderBy(desc(mascotas.updatedAt));

  if (lista.length === 0) return [];

  const ids = lista.map((m) => m.id);
  const fotos = await db
    .select()
    .from(mascotaFotos)
    .where(inArray(mascotaFotos.mascotaId, ids))
    .orderBy(mascotaFotos.orden);

  const fotoPrincipal = new Map<string, string>();
  for (const f of fotos) {
    if (f.esPrincipal && !fotoPrincipal.has(f.mascotaId)) {
      fotoPrincipal.set(f.mascotaId, f.url);
    }
  }
  for (const f of fotos) {
    if (!fotoPrincipal.has(f.mascotaId)) {
      fotoPrincipal.set(f.mascotaId, f.url);
    }
  }

  return lista.map((m) => ({
    ...m,
    fotoPrincipal: fotoPrincipal.get(m.id) ?? null,
  }));
}

export async function listarMascotasPerdidasPublicas(limite = 8) {
  const lista = await db
    .select({
      id: mascotas.id,
      slug: mascotas.slug,
      nombre: mascotas.nombre,
      tipo: mascotas.tipo,
      raza: mascotas.raza,
      sexo: mascotas.sexo,
      edad: mascotas.edad,
      color: mascotas.color,
      estado: mascotas.estado,
      lugarPerdida: mascotas.lugarPerdida,
      fechaPerdida: mascotas.fechaPerdida,
      updatedAt: mascotas.updatedAt,
    })
    .from(mascotas)
    .where(inArray(mascotas.estado, ["PERDIDA", "ENCONTRADA"]))
    .orderBy(desc(mascotas.updatedAt))
    .limit(limite);

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

export async function obtenerMascotaPropia(id: string) {
  const userId = await sesionUsuario();
  if (!userId) return null;

  const [mascota] = await db
    .select()
    .from(mascotas)
    .where(and(eq(mascotas.id, id), eq(mascotas.userId, userId)))
    .limit(1);

  if (!mascota) return null;

  const fotos = await db
    .select()
    .from(mascotaFotos)
    .where(eq(mascotaFotos.mascotaId, id))
    .orderBy(mascotaFotos.orden);

  const historial = await db
    .select()
    .from(historialEstadoMascota)
    .where(eq(historialEstadoMascota.mascotaId, id))
    .orderBy(desc(historialEstadoMascota.createdAt));

  return { mascota, fotos, historial };
}

export async function obtenerMascotaPublica(slug: string) {
  const [fila] = await db
    .select({
      mascota: mascotas,
      duenoNombre: users.name,
    })
    .from(mascotas)
    .innerJoin(users, eq(mascotas.userId, users.id))
    .where(eq(mascotas.slug, slug))
    .limit(1);

  if (!fila || !esFichaPublica(fila.mascota.estado)) {
    return null;
  }

  const fotos = await db
    .select()
    .from(mascotaFotos)
    .where(eq(mascotaFotos.mascotaId, fila.mascota.id))
    .orderBy(mascotaFotos.orden);

  const historial = await db
    .select({
      estadoNuevo: historialEstadoMascota.estadoNuevo,
      notas: historialEstadoMascota.notas,
      createdAt: historialEstadoMascota.createdAt,
    })
    .from(historialEstadoMascota)
    .where(eq(historialEstadoMascota.mascotaId, fila.mascota.id))
    .orderBy(desc(historialEstadoMascota.createdAt))
    .limit(20);

  return {
    mascota: fila.mascota,
    duenoNombre: fila.duenoNombre,
    fotos,
    historial,
  };
}

export async function crearMascota(
  datos: DatosFichaMascota,
  fotosNuevas: string[] = []
): Promise<ResultadoAuth & { id?: string; slug?: string }> {
  const userId = await sesionUsuario();
  if (!userId) {
    return { ok: false, error: "Debes iniciar sesión." };
  }

  const validacion = validarDatosMascota(datos);
  if (!validacion.ok) return { ok: false, error: validacion.error };

  const validacionFotos = validarFotosDataUrl(fotosNuevas);
  if (!validacionFotos.ok) return { ok: false, error: validacionFotos.error };

  const ficha = normalizarFicha({ ...datos, nombre: validacion.nombre, tipo: validacion.tipo });
  const slug = generarSlugMascota(validacion.nombre);
  const ahora = new Date();

  const [insertada] = await db
    .insert(mascotas)
    .values({
      userId,
      slug,
      ...ficha,
      estado: "EN_CASA",
      updatedAt: ahora,
    })
    .returning({ id: mascotas.id, slug: mascotas.slug });

  await db.insert(historialEstadoMascota).values({
    mascotaId: insertada.id,
    estadoAnterior: "EN_CASA",
    estadoNuevo: "EN_CASA",
    userId,
    notas: "Alta de ficha digital",
  });
  await guardarFotos(insertada.id, fotosNuevas);

  revalidarRutasMascota(insertada.id, insertada.slug);

  return {
    ok: true,
    mensaje: "Ficha de mascota creada.",
    id: insertada.id,
    slug: insertada.slug,
  };
}

export async function actualizarMascota(
  id: string,
  datos: DatosFichaMascota,
  fotosNuevas?: string[]
): Promise<ResultadoAuth> {
  const userId = await sesionUsuario();
  if (!userId) {
    return { ok: false, error: "Debes iniciar sesión." };
  }

  const [actual] = await db
    .select()
    .from(mascotas)
    .where(and(eq(mascotas.id, id), eq(mascotas.userId, userId)))
    .limit(1);

  if (!actual) {
    return { ok: false, error: "Mascota no encontrada." };
  }

  const validacion = validarDatosMascota(datos);
  if (!validacion.ok) return { ok: false, error: validacion.error };

  if (fotosNuevas !== undefined) {
    const validacionFotos = validarFotosDataUrl(fotosNuevas);
    if (!validacionFotos.ok) return { ok: false, error: validacionFotos.error };
  }

  const ficha = normalizarFicha({ ...datos, nombre: validacion.nombre, tipo: validacion.tipo });

  await db
    .update(mascotas)
    .set({ ...ficha, updatedAt: new Date() })
    .where(eq(mascotas.id, id));

  if (fotosNuevas !== undefined) {
    await reemplazarFotos(id, fotosNuevas);
  }

  revalidarRutasMascota(id, actual.slug);

  return { ok: true, mensaje: "Ficha actualizada." };
}

export async function cambiarEstadoMascota(
  id: string,
  estadoNuevo: EstadoMascota,
  opciones?: {
    notas?: string;
    fechaPerdida?: string;
    lugarPerdida?: string;
  }
): Promise<ResultadoAuth> {
  const userId = await sesionUsuario();
  if (!userId) {
    return { ok: false, error: "Debes iniciar sesión." };
  }

  const [actual] = await db
    .select()
    .from(mascotas)
    .where(and(eq(mascotas.id, id), eq(mascotas.userId, userId)))
    .limit(1);

  if (!actual) {
    return { ok: false, error: "Mascota no encontrada." };
  }

  const permitidos = TRANSICIONES_ESTADO[actual.estado];
  if (!permitidos.includes(estadoNuevo)) {
    return {
      ok: false,
      error: `No puedes cambiar de ${actual.estado} a ${estadoNuevo}.`,
    };
  }

  if (estadoNuevo === "PERDIDA") {
    if (!opciones?.lugarPerdida?.trim()) {
      return { ok: false, error: "Indica el lugar donde se perdió." };
    }
  }

  const fechaPerdida =
    estadoNuevo === "PERDIDA" && opciones?.fechaPerdida
      ? new Date(opciones.fechaPerdida)
      : estadoNuevo === "PERDIDA"
        ? new Date()
        : actual.fechaPerdida;

  const lugarPerdida =
    estadoNuevo === "PERDIDA"
      ? opciones?.lugarPerdida?.trim() ?? actual.lugarPerdida
      : estadoNuevo === "EN_CASA" || estadoNuevo === "REUNIDA"
        ? null
        : actual.lugarPerdida;

  await db
    .update(mascotas)
    .set({
      estado: estadoNuevo,
      fechaPerdida:
        estadoNuevo === "EN_CASA" || estadoNuevo === "REUNIDA"
          ? null
          : fechaPerdida,
      lugarPerdida,
      updatedAt: new Date(),
    })
    .where(eq(mascotas.id, id));

  await registrarHistorial(
    id,
    actual.estado,
    estadoNuevo,
    userId,
    opciones?.notas
  );

  revalidarRutasMascota(id, actual.slug);

  const mensajes: Partial<Record<EstadoMascota, string>> = {
    PERDIDA: "Mascota marcada como perdida. La ficha pública ya está visible.",
    ENCONTRADA: "Marcada como encontrada. La comunidad puede ver el aviso.",
    REUNIDA: "¡Felicidades! Marcada como reunida con su familia.",
    EN_CASA: "Estado actualizado: en casa.",
  };

  return {
    ok: true,
    mensaje: mensajes[estadoNuevo] ?? "Estado actualizado.",
  };
}

export async function eliminarMascota(id: string): Promise<ResultadoAuth> {
  const userId = await sesionUsuario();
  if (!userId) {
    return { ok: false, error: "Debes iniciar sesión." };
  }

  const [actual] = await db
    .select({ slug: mascotas.slug })
    .from(mascotas)
    .where(and(eq(mascotas.id, id), eq(mascotas.userId, userId)))
    .limit(1);

  if (!actual) {
    return { ok: false, error: "Mascota no encontrada." };
  }

  await db.delete(mascotas).where(eq(mascotas.id, id));

  revalidarRutasMascota(id, actual.slug);

  return { ok: true, mensaje: "Mascota eliminada." };
}

/** Compatibilidad con formulario simple anterior */
export async function crearMascotaBasica(datos: {
  nombre: string;
  tipo: string;
  raza?: string;
  sexo?: string;
  color?: string;
}): Promise<ResultadoAuth> {
  return crearMascota(datos);
}
