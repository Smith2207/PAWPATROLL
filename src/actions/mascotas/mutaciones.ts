"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  mascotas,
  type DatosFichaMascota,
  type EstadoMascota,
} from "@/lib/db/schema";
import type { ResultadoAuth } from "@/actions/autenticacion";
import { TRANSICIONES_ESTADO } from "@/lib/mascotas/estados";
import {
  generarSlugMascota,
  validarDatosMascota,
  validarFotosDataUrl,
} from "@/lib/mascotas/validacion";
import { esTipoMascotaPermitido } from "@/lib/mascotas/tipos";
import { estimarRadioBusquedaMetros } from "@/lib/geo/cerco-perimetrico";
import {
  crearNotificacionPrivada,
  registrarEventoCaso,
} from "@/lib/casos/servicio-caso";
import { sesionUsuario } from "@/lib/auth/sesion-servidor";
import {
  guardarFotos,
  indexarClipMascota,
  normalizarFicha,
  reemplazarFotos,
  revalidarRutasMascota,
} from "@/actions/mascotas/helpers";

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

  const ficha = normalizarFicha({
    ...datos,
    nombre: validacion.nombre,
    tipo: validacion.tipo,
  });
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

  const ficha = normalizarFicha({
    ...datos,
    nombre: validacion.nombre,
    tipo: validacion.tipo,
  });

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
      error: "Esta mascota no es válida en PawPatroll (solo perros y gatos).",
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
