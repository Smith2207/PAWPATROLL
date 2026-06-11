/**
 * API REST (/api/geo/ubicacion): endpoint geo › ubicacion.
 */
import { NextResponse } from "next/server";
import { geolocalizarPorIpCliente } from "@/lib/geo/geolocalizar-ip";
import { verificarRateLimit, ipDesdeRequest } from "@/lib/api/rate-limit";

/** Respaldo por IP del visitante (cuando falla el GPS del navegador). */
export async function POST(req: Request) {
  const bloqueado = verificarRateLimit(req, "geo-ubicacion", 15);
  if (bloqueado) return bloqueado;

  const ip = ipDesdeRequest(req);

  try {
    const resultado = await geolocalizarPorIpCliente(ip);

    if (!resultado.ok) {
      if (process.env.NODE_ENV === "development" && resultado.detalle) {
        console.warn("[geo/ubicacion]", resultado.detalle);
      }
      return NextResponse.json({
        ok: false,
        error: resultado.error,
        ...(process.env.NODE_ENV === "development" && resultado.detalle
          ? { detalle: resultado.detalle }
          : {}),
      });
    }

    return NextResponse.json({
      ok: true,
      lat: resultado.lat,
      lng: resultado.lng,
      precisionMetros: resultado.precisionMetros,
      origen: "ip-cliente",
    });
  } catch (e) {
    console.error("[geo/ubicacion]", e);
    return NextResponse.json(
      { ok: false, error: "Error al consultar ubicación por red." },
      { status: 500 }
    );
  }
}
