/**
 * API REST (/api/ws/token): endpoint ws › token.
 */
import { auth } from "@/auth";
import { canalesTiempoRealUsuario } from "@/lib/tiempo-real/canales-usuario";
import { crearTokenSuscripcionWs } from "@/lib/tiempo-real/token-ws";
import { ipDesdeRequest, rateLimit, respuestaRateLimit } from "@/lib/api/rate-limit";

export async function GET(req: Request) {
  const ip = ipDesdeRequest(req);
  const limite = rateLimit(`ws-token:${ip}`, 30, 60_000);
  if (!limite.ok) return respuestaRateLimit(limite.reintentarEnSeg);

  const sesion = await auth();
  const userId = sesion?.user?.id;
  if (!userId) {
    return Response.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  const canales = await canalesTiempoRealUsuario(userId);
  const token = crearTokenSuscripcionWs(userId, canales);

  if (!token) {
    return Response.json(
      {
        ok: false,
        error: "WS_PUBLISH_SECRET o AUTH_SECRET no configurado.",
      },
      { status: 503 }
    );
  }

  return Response.json({ ok: true, token, canales });
}
