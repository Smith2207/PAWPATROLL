type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Límite en memoria por IP (serverless: por instancia; suficiente como primera barrera). */
export function rateLimit(
  clave: string,
  limite: number,
  ventanaMs: number
): { ok: true } | { ok: false; reintentarEnSeg: number } {
  const ahora = Date.now();
  let bucket = buckets.get(clave);

  if (!bucket || ahora >= bucket.resetAt) {
    bucket = { count: 0, resetAt: ahora + ventanaMs };
    buckets.set(clave, bucket);
  }

  bucket.count += 1;

  if (bucket.count > limite) {
    return {
      ok: false,
      reintentarEnSeg: Math.max(1, Math.ceil((bucket.resetAt - ahora) / 1000)),
    };
  }

  return { ok: true };
}

export function ipDesdeRequest(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "anon";
  return req.headers.get("x-real-ip")?.trim() || "anon";
}

export function respuestaRateLimit(reintentarEnSeg: number, limite?: number) {
  const headers: Record<string, string> = {
    "Retry-After": String(reintentarEnSeg),
  };
  if (limite != null) {
    headers["X-RateLimit-Limit"] = String(limite);
    headers["X-RateLimit-Remaining"] = "0";
  }
  return Response.json(
    { ok: false, error: "Demasiadas solicitudes. Intenta de nuevo en un momento." },
    {
      status: 429,
      headers,
    }
  );
}
