"use server";

import { and, count, desc, eq, gte, ilike, inArray, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  avistamientos,
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
import {
  TIPOS_MASCOTA,
  esTipoMascotaPermitido,
  type TipoMascota,
} from "@/lib/mascotas/tipos";
import { estimarRadioBusquedaMetros } from "@/lib/geo/cerco-perimetrico";
import {
  crearNotificacionPrivada,
  registrarEventoCaso,
} from "@/lib/casos/servicio-caso";
function indexarClipMascota(mascotaId: string) {
  void import("@/lib/visual/indice-visual").then((m) =>
    m.sincronizarEmbeddingMascota(mascotaId)
  );
}

function soloPerrosYGatos() {
  return inArray(mascotas.tipo, [...TIPOS_MASCOTA]);
}

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
    enfermedades: datos.enfermedades?.trim() || null,
    accesoExterior: datos.accesoExterior?.trim() || null,
  };
}

async function guardarFotos(mascotaId: string, fotos: string[]) {
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
    .where(and(eq(mascotas.userId, userId), soloPerrosYGatos()))
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

  const pendientesRows = await db
    .select({
      mascotaId: avistamientos.mascotaId,
      total: count(),
    })
    .from(avistamientos)
    .where(
      and(
        inArray(avistamientos.mascotaId, ids),
        eq(avistamientos.estado, "PENDIENTE")
      )
    )
    .groupBy(avistamientos.mascotaId);

  const totalAvistRows = await db
    .select({
      mascotaId: avistamientos.mascotaId,
      total: count(),
    })
    .from(avistamientos)
    .where(inArray(avistamientos.mascotaId, ids))
    .groupBy(avistamientos.mascotaId);

  const pendientesPorMascota = new Map(
    pendientesRows
      .filter((r): r is { mascotaId: string; total: number } => Boolean(r.mascotaId))
      .map((r) => [r.mascotaId, Number(r.total)])
  );

  const totalAvistPorMascota = new Map(
    totalAvistRows
      .filter((r): r is { mascotaId: string; total: number } => Boolean(r.mascotaId))
      .map((r) => [r.mascotaId, Number(r.total)])
  );

  return lista.map((m) => ({
    ...m,
    fotoPrincipal: fotoPrincipal.get(m.id) ?? null,
    avistamientosPendientes: pendientesPorMascota.get(m.id) ?? 0,
    totalAvistamientos: totalAvistPorMascota.get(m.id) ?? 0,
  }));
}

export type FiltrosBusquedaMascotasPublicas = {
  q?: string;
  /** Filtros rápidos (valores en BD: Perro, Gato) */
  tipo?: TipoMascota;
  /** Días hacia atrás desde hoy (ej. 1 = últimas 24 h) */
  dias?: number;
  limite?: number;
};

type MascotaPublicaLista = {
  id: string;
  slug: string;
  nombre: string;
  tipo: string;
  raza: string | null;
  sexo: string | null;
  edad: string | null;
  color: string | null;
  estado: EstadoMascota;
  lugarPerdida: string | null;
  fechaPerdida: Date | null;
  updatedAt: Date;
  fotoPrincipal: string | null;
};

async function adjuntarFotoPrincipal<
  T extends { id: string },
>(lista: T[]): Promise<(T & { fotoPrincipal: string | null })[]> {
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

export async function buscarMascotasPublicas(
  filtros: FiltrosBusquedaMascotasPublicas = {}
): Promise<MascotaPublicaLista[]> {
  const limite = Math.min(Math.max(filtros.limite ?? 24, 1), 48);
  const condiciones = [
    inArray(mascotas.estado, ["PERDIDA", "ENCONTRADA"]),
    soloPerrosYGatos(),
  ];

  if (filtros.tipo && esTipoMascotaPermitido(filtros.tipo)) {
    condiciones.push(eq(mascotas.tipo, filtros.tipo));
  }

  if (filtros.dias && filtros.dias > 0) {
    const desde = new Date();
    desde.setDate(desde.getDate() - filtros.dias);
    condiciones.push(
      gte(sql`COALESCE(${mascotas.fechaPerdida}, ${mascotas.updatedAt})`, desde)
    );
  }

  const q = filtros.q?.trim();
  if (q) {
    const patron = `%${q.replace(/[%_]/g, "")}%`;
    condiciones.push(
      or(
        ilike(mascotas.nombre, patron),
        ilike(mascotas.tipo, patron),
        ilike(mascotas.raza, patron),
        ilike(mascotas.color, patron),
        ilike(mascotas.lugarPerdida, patron),
        ilike(mascotas.descripcion, patron)
      )!
    );
  }

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
    .where(and(...condiciones))
    .orderBy(desc(mascotas.updatedAt))
    .limit(limite);

  return adjuntarFotoPrincipal(lista);
}

export async function listarMascotasPerdidasPublicas(limite = 8) {
  return buscarMascotasPublicas({ limite });
}

export async function obtenerMascotaPropia(id: string) {
  const userId = await sesionUsuario();
  if (!userId) return null;

  const [mascota] = await db
    .select()
    .from(mascotas)
    .where(and(eq(mascotas.id, id), eq(mascotas.userId, userId)))
    .limit(1);

  if (!mascota || !esTipoMascotaPermitido(mascota.tipo)) return null;

  const fotos = await db
    .select()
    .from(mascotaFotos)
    .where(eq(mascotaFotos.mascotaId, id))
    .orderBy(mascotaFotos.orden);

  const [pendientesRow] = await db
    .select({ total: count() })
    .from(avistamientos)
    .where(
      and(
        eq(avistamientos.mascotaId, id),
        eq(avistamientos.estado, "PENDIENTE")
      )
    );

  const [totalAvistRow] = await db
    .select({ total: count() })
    .from(avistamientos)
    .where(eq(avistamientos.mascotaId, id));

  return {
    mascota: {
      ...mascota,
      avistamientosPendientes: Number(pendientesRow?.total ?? 0),
      totalAvistamientos: Number(totalAvistRow?.total ?? 0),
    },
    fotos,
  };
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

  if (!esTipoMascotaPermitido(fila.mascota.tipo)) {
    return null;
  }

  const fotos = await db
    .select()
    .from(mascotaFotos)
    .where(eq(mascotaFotos.mascotaId, fila.mascota.id))
    .orderBy(mascotaFotos.orden);

  return {
    mascota: fila.mascota,
    duenoNombre: fila.duenoNombre,
    fotos,
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

  await guardarFotos(insertada.id, fotosNuevas);

  indexarClipMascota(insertada.id);

  revalidarRutasMascota(insertada.id, insertada.slug);

  return {
    ok: true,
    mensaje: "Mascota creada.",
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

  if (!esTipoMascotaPermitido(actual.tipo)) {
    return {
      ok: false,
      error: "Esta mascota no es válida en PawPatroll (solo perros y gatos).",
    };
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

  indexarClipMascota(id);

  revalidarRutasMascota(id, actual.slug);

  return { ok: true, mensaje: "Mascota actualizada." };
}

export async function cambiarEstadoMascota(
  id: string,
  estadoNuevo: EstadoMascota,
  opciones?: {
    notas?: string;
    fechaPerdida?: string;
    lugarPerdida?: string;
    latPerdida?: number;
    lngPerdida?: number;
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

  if (!esTipoMascotaPermitido(actual.tipo)) {
    return {
      ok: false,
      error: "Esta mascota no es válida en PawPatrol (solo perros y gatos).",
    };
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

  const latPerdida =
    estadoNuevo === "PERDIDA" && opciones?.latPerdida != null
      ? String(opciones.latPerdida)
      : estadoNuevo === "EN_CASA" || estadoNuevo === "REUNIDA"
        ? null
        : actual.latPerdida;

  const lngPerdida =
    estadoNuevo === "PERDIDA" && opciones?.lngPerdida != null
      ? String(opciones.lngPerdida)
      : estadoNuevo === "EN_CASA" || estadoNuevo === "REUNIDA"
        ? null
        : actual.lngPerdida;

  const radioBusquedaMetros =
    estadoNuevo === "PERDIDA"
      ? estimarRadioBusquedaMetros({
          tipo: actual.tipo,
          tamano: actual.tamano,
          edad: actual.edad,
          accesoExterior: actual.accesoExterior,
          descripcion: actual.descripcion,
          senasParticulares: actual.senasParticulares,
        })
      : estadoNuevo === "EN_CASA" || estadoNuevo === "REUNIDA"
        ? null
        : actual.radioBusquedaMetros;

  await db
    .update(mascotas)
    .set({
      estado: estadoNuevo,
      fechaPerdida:
        estadoNuevo === "EN_CASA" || estadoNuevo === "REUNIDA"
          ? null
          : fechaPerdida,
      lugarPerdida,
      latPerdida,
      lngPerdida,
      radioBusquedaMetros,
      updatedAt: new Date(),
    })
    .where(eq(mascotas.id, id));

  if (estadoNuevo === "PERDIDA") {
    await registrarEventoCaso({
      mascotaId: id,
      tipo: "ALERTA_ACTIVADA",
      titulo: `${actual.nombre} reportada como perdida`,
      detalle:
        [opciones?.lugarPerdida?.trim(), opciones?.notas?.trim()]
          .filter(Boolean)
          .join(" · ") || undefined,
      actorUserId: userId,
    });
  } else if (estadoNuevo === "REUNIDA") {
    await registrarEventoCaso({
      mascotaId: id,
      tipo: "MASCOTA_RECUPERADA",
      titulo: `¡${actual.nombre} reunida con su familia!`,
      actorUserId: userId,
    });
    await crearNotificacionPrivada({
      userId,
      tipo: "CASO_RECUPERADO",
      prioridad: "NORMAL",
      titulo: `Caso cerrado: ${actual.nombre} reunida`,
      cuerpo: "Felicitaciones. El caso de búsqueda quedó archivado.",
      enlace: `/mis-mascotas/${id}`,
      mascotaId: id,
      grupoClave: `recuperada:${id}`,
    });
  } else if (estadoNuevo !== actual.estado) {
    await registrarEventoCaso({
      mascotaId: id,
      tipo: "ESTADO_CAMBIADO",
      titulo: `Estado: ${actual.estado} → ${estadoNuevo}`,
      actorUserId: userId,
      detalle: opciones?.notas,
    });
  }

  indexarClipMascota(id);

  revalidarRutasMascota(id, actual.slug);

  const mensajes: Partial<Record<EstadoMascota, string>> = {
    PERDIDA: "Mascota marcada como perdida. La página pública ya está visible.",
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
