/**
 * API REST (/api/auth/verificar-cuenta): endpoint auth › verificar-cuenta.
 */
import { NextResponse } from "next/server";
import {
  consultarEstadoVerificacion,
  verificarCuentaConToken,
} from "@/lib/auth/verificar-cuenta";
import { ipDesdeRequest, rateLimit, respuestaRateLimit } from "@/lib/api/rate-limit";

/**
 * POST /api/auth/verificar-cuenta
 * Body JSON: { "email": "...", "token": "..." }
 *
 * GET /api/auth/verificar-cuenta?email=...&token=...
 * Devuelve JSON (para apps o pruebas con Postman)
 */
export async function POST(request: Request) {
  let body: { email?: string; token?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "JSON inválido.", codigo: "PARAMETROS_INVALIDOS" },
      { status: 400 }
    );
  }

  const resultado = await verificarCuentaConToken(
    body.email ?? "",
    body.token ?? ""
  );

  if (!resultado.ok) {
    const status =
      resultado.codigo === "PARAMETROS_INVALIDOS"
        ? 400
        : resultado.codigo === "YA_VERIFICADO"
          ? 409
          : 422;
    return NextResponse.json(resultado, { status });
  }

  return NextResponse.json(resultado);
}

export async function GET(request: Request) {
  const ip = ipDesdeRequest(request);
  const limite = rateLimit(`verificar-cuenta:${ip}`, 20, 60_000);
  if (!limite.ok) return respuestaRateLimit(limite.reintentarEnSeg);

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const token = searchParams.get("token");
  const soloEstado = searchParams.get("estado") === "1";

  if (soloEstado || (!token && email)) {
    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Parámetro email requerido." },
        { status: 400 }
      );
    }
    const estado = await consultarEstadoVerificacion(email);
    return NextResponse.json(estado, { status: estado.ok ? 200 : 404 });
  }

  if (!email || !token) {
    return NextResponse.json(
      {
        ok: false,
        error: "Parámetros email y token requeridos.",
        codigo: "PARAMETROS_INVALIDOS",
      },
      { status: 400 }
    );
  }

  const resultado = await verificarCuentaConToken(email, token);

  if (!resultado.ok) {
    const status =
      resultado.codigo === "YA_VERIFICADO" ? 409 : 422;
    return NextResponse.json(resultado, { status });
  }

  return NextResponse.json(resultado);
}
