import type { UbicacionSeleccionada } from "@/lib/geo/tipos";

/** Ubicación aproximada vía Google Geolocation API (servidor, ~1–2 s en PC). */
export async function obtenerUbicacionViaGoogle(): Promise<UbicacionSeleccionada | null> {
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
        console.warn("[Google Geolocation]", data.error, data.detalle);
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
