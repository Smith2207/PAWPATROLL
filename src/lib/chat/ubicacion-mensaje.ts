export type UbicacionChat = {
  lat: number;
  lng: number;
  label: string;
  /** Ubicación GPS capturada al enviar el mensaje (no un punto histórico). */
  enVivo?: boolean;
};

const MARCADOR = "__PP_LOC__";
/** ~1 cm de precisión en coordenadas GPS */
const DECIMALES_GPS = 7;
const ZOOM_MAPA_EXACTO = 17;

function coordsPrecisas(lat: number, lng: number): string {
  return `${lat.toFixed(DECIMALES_GPS)},${lng.toFixed(DECIMALES_GPS)}`;
}

export function serializarUbicacionChat(ubicacion: UbicacionChat): string {
  return `${MARCADOR}${JSON.stringify({
    lat: Number(ubicacion.lat.toFixed(DECIMALES_GPS)),
    lng: Number(ubicacion.lng.toFixed(DECIMALES_GPS)),
    label: ubicacion.label.trim().slice(0, 240),
    ...(ubicacion.enVivo ? { enVivo: true } : {}),
  })}`;
}

export function esMensajeUbicacion(contenido: string): boolean {
  return parsearUbicacionMensaje(contenido) != null;
}

export function parsearUbicacionMensaje(contenido: string): UbicacionChat | null {
  const texto = contenido.trim();
  if (!texto) return null;

  if (texto.startsWith(MARCADOR)) {
    try {
      const data = JSON.parse(texto.slice(MARCADOR.length)) as {
        lat?: unknown;
        lng?: unknown;
        label?: unknown;
        enVivo?: unknown;
      };
      const lat = Number(data.lat);
      const lng = Number(data.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      const label =
        typeof data.label === "string" && data.label.trim()
          ? data.label.trim()
          : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      return {
        lat,
        lng,
        label,
        enVivo: data.enVivo === true,
      };
    } catch {
      return null;
    }
  }

  const urlMatch =
    /https?:\/\/(?:maps\.google\.com\/\?q=|www\.google\.com\/maps\?q=)(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i.exec(
      texto
    );
  if (urlMatch) {
    const lat = Number.parseFloat(urlMatch[1]);
    const lng = Number.parseFloat(urlMatch[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const sinUrl = texto.replace(urlMatch[0], "").replace(/^📍\s*/, "").trim();
      return {
        lat,
        lng,
        label: sinUrl || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      };
    }
  }

  return null;
}

function claveGoogleMapsPublica(): string | null {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || null;
}

/** Miniatura de mapa para burbujas de chat (pin en coordenadas GPS exactas). */
export function urlMapaEstaticoChat(
  lat: number,
  lng: number,
  ancho = 280,
  alto = 140
): string {
  const punto = coordsPrecisas(lat, lng);
  const key = claveGoogleMapsPublica();
  if (key) {
    const params = new URLSearchParams({
      center: punto,
      zoom: String(ZOOM_MAPA_EXACTO),
      size: `${ancho}x${alto}`,
      scale: "2",
      maptype: "roadmap",
      markers: `size:mid|color:0xE53935|${punto}`,
      key,
    });
    return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
  }

  const osm = new URL("https://staticmap.openstreetmap.de/staticmap.php");
  osm.searchParams.set("center", punto);
  osm.searchParams.set("zoom", String(ZOOM_MAPA_EXACTO));
  osm.searchParams.set("size", `${ancho}x${alto}`);
  osm.searchParams.set("markers", `${lat},${lng},red-pushpin`);
  return osm.toString();
}

export function urlAbrirUbicacionEnMaps(lat: number, lng: number): string {
  const punto = coordsPrecisas(lat, lng);
  return `https://www.google.com/maps/search/?api=1&query=${punto}&zoom=${ZOOM_MAPA_EXACTO}`;
}
