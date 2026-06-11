import type { UbicacionSeleccionada } from "@/lib/geo/tipos";

/** Ubicación aproximada por IP del visitante (respaldo si falla el GPS). */
export async function obtenerUbicacionViaRed(): Promise<UbicacionSeleccionada | null> {
  try {
    const res = await fetch("/api/geo/ubicacion", { method: "POST" });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      ok?: boolean;
      lat?: number;
      lng?: number;
      precisionMetros?: number;
      error?: string;
      detalle?: string;
    };

    if (
      !data.ok ||
      !Number.isFinite(data.lat) ||
      !Number.isFinite(data.lng)
    ) {
      if (process.env.NODE_ENV === "development" && data.detalle) {
        console.warn("[geo/red]", data.error, data.detalle);
      }
      return null;
    }

    return {
      lat: data.lat!,
      lng: data.lng!,
      precisionMetros: data.precisionMetros ?? 500,
    };
  } catch {
    return null;
  }
}

/** Elige la lectura más precisa (menor `precisionMetros`). */
export function elegirMejorUbicacion(
  a: UbicacionSeleccionada | null,
  b: UbicacionSeleccionada | null
): UbicacionSeleccionada | null {
  if (!a) return b;
  if (!b) return a;
  const pa = a.precisionMetros ?? Number.POSITIVE_INFINITY;
  const pb = b.precisionMetros ?? Number.POSITIVE_INFINITY;
  return pa <= pb ? a : b;
}

/** @deprecated Usar obtenerUbicacionViaRed */
export const obtenerUbicacionViaGoogle = obtenerUbicacionViaRed;
