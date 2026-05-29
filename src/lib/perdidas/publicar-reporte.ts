import { crearMascota, cambiarEstadoMascota } from "@/actions/mascotas";
import type { BorradorReportePerdida } from "@/lib/perdidas/borrador-cliente";

export type ResultadoPublicarPerdida =
  | { ok: true; mensaje: string; slug?: string }
  | { ok: false; error: string };

export async function publicarReportePerdida(
  borrador: BorradorReportePerdida
): Promise<ResultadoPublicarPerdida> {
  const creada = await crearMascota(borrador.datosMascota, borrador.fotos);

  if (!creada.ok || !creada.id) {
    return {
      ok: false,
      error:
        !creada.ok && "error" in creada
          ? creada.error
          : "No se pudo crear la ficha.",
    };
  }

  const perdida = await cambiarEstadoMascota(creada.id, "PERDIDA", {
    lugarPerdida: borrador.perdida.lugarPerdida,
    fechaPerdida: borrador.perdida.fechaPerdida,
    latPerdida: borrador.perdida.latPerdida,
    lngPerdida: borrador.perdida.lngPerdida,
    notas: borrador.perdida.notas,
  });

  if (!perdida.ok) {
    return {
      ok: false,
      error:
        perdida.error ??
        "La ficha se creó, pero no se pudo activar la alerta. Complétalo en Mis fichas.",
    };
  }

  return {
    ok: true,
    mensaje: perdida.mensaje ?? "Alerta activada. Comparte la ficha pública.",
    slug: creada.slug,
  };
}
