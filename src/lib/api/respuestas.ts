/**
 * Utilidades de API (respuestas JSON comunes).
 */
import { NextResponse } from "next/server";

export function jsonError(mensaje: string, status = 400) {
  return NextResponse.json({ error: mensaje }, { status });
}

export function jsonErrorInterno(mensaje = "Error interno del servidor.") {
  return jsonError(mensaje, 500);
}
