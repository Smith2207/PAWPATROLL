/**
 * Geolocalización y mapas: geolocalizar-ip.
 */
import { estaEnPeru } from "@/lib/geo/bounds-peru";

export type ResultadoGeolocalizarIp =
  | { ok: true; lat: number; lng: number; precisionMetros: number }
  | { ok: false; error: string; detalle?: string };

const UA = "PawPatroll/1.0 (+https://pawpatroll.vercel.app)";

function ipEsLocal(ip: string): boolean {
  const t = ip.trim().toLowerCase();
  return (
    !t ||
    t === "anon" ||
    t === "::1" ||
    t.startsWith("127.") ||
    t.startsWith("10.") ||
    t.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(t)
  );
}

type LecturaIp = {
  lat: number;
  lng: number;
  countryCode?: string;
};

function validarLecturaPeru(
  lectura: LecturaIp | null,
  proveedor: string
): ResultadoGeolocalizarIp | null {
  if (!lectura) return null;

  const { lat, lng, countryCode } = lectura;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return {
      ok: false,
      error: "Respuesta de ubicación por IP incompleta.",
      detalle: proveedor,
    };
  }

  if (countryCode !== "PE" && !estaEnPeru(lat, lng)) {
    return {
      ok: false,
      error:
        "Tu red parece estar fuera de Perú. Activa el GPS del navegador o marca el punto en el mapa.",
      detalle: `${proveedor}: country=${countryCode ?? "?"}`,
    };
  }

  return {
    ok: true,
    lat,
    lng,
    precisionMetros: 20_000,
  };
}

async function consultarGeojs(ipCliente: string): Promise<LecturaIp | null> {
  const url = ipEsLocal(ipCliente)
    ? "https://get.geojs.io/v1/ip/geo.json"
    : `https://get.geojs.io/v1/ip/geo/${encodeURIComponent(ipCliente)}.json`;

  const res = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json", "User-Agent": UA },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    latitude?: string | number;
    longitude?: string | number;
    country_code?: string;
  };

  const lat = Number(data.latitude);
  const lng = Number(data.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { lat, lng, countryCode: data.country_code };
}

async function consultarIpApi(ipCliente: string): Promise<LecturaIp | null> {
  const base = ipEsLocal(ipCliente)
    ? "http://ip-api.com/json/"
    : `http://ip-api.com/json/${encodeURIComponent(ipCliente)}`;
  const url = `${base}?fields=status,message,countryCode,lat,lon`;

  const res = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json", "User-Agent": UA },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    status?: string;
    countryCode?: string;
    lat?: number;
    lon?: number;
  };

  if (data.status !== "success" || data.lat == null || data.lon == null) {
    return null;
  }

  return { lat: data.lat, lng: data.lon, countryCode: data.countryCode };
}

async function consultarIpWho(ipCliente: string): Promise<LecturaIp | null> {
  const url = ipEsLocal(ipCliente)
    ? "https://ipwho.is/"
    : `https://ipwho.is/${encodeURIComponent(ipCliente)}`;

  const res = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json", "User-Agent": UA },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    success?: boolean;
    latitude?: number;
    longitude?: number;
    country_code?: string;
  };

  if (!data.success || data.latitude == null || data.longitude == null) {
    return null;
  }

  return {
    lat: data.latitude,
    lng: data.longitude,
    countryCode: data.country_code,
  };
}

/**
 * Ubicación aproximada por IP del visitante (x-forwarded-for en producción).
 */
export async function geolocalizarPorIpCliente(
  ipCliente: string
): Promise<ResultadoGeolocalizarIp> {
  const proveedores: Array<{
    nombre: string;
    consultar: (ip: string) => Promise<LecturaIp | null>;
  }> = [
    { nombre: "geojs", consultar: consultarGeojs },
    { nombre: "ip-api", consultar: consultarIpApi },
    { nombre: "ipwho", consultar: consultarIpWho },
  ];

  const errores: string[] = [];

  for (const { nombre, consultar } of proveedores) {
    try {
      const lectura = await consultar(ipCliente);
      const validado = validarLecturaPeru(lectura, nombre);
      if (validado?.ok) return validado;
      if (validado && !validado.ok) return validado;
      errores.push(`${nombre}: sin datos`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errores.push(`${nombre}: ${msg}`);
    }
  }

  return {
    ok: false,
    error: "No pudimos estimar tu ubicación por red.",
    detalle: errores.join("; "),
  };
}
