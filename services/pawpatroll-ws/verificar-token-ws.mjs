import { createHmac, timingSafeEqual } from "node:crypto";

function secretoWs() {
  return (
    process.env.WS_PUBLISH_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    ""
  );
}

function firmar(payload, secret) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/** @returns {{ userId: string, canales: string[], exp: number } | null} */
export function verificarTokenSuscripcionWs(token) {
  const secret = secretoWs();
  if (!secret || !token) return null;

  const [cuerpo, firma] = String(token).split(".");
  if (!cuerpo || !firma) return null;

  const esperada = firmar(cuerpo, secret);
  try {
    const a = Buffer.from(firma);
    const b = Buffer.from(esperada);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(cuerpo, "base64url").toString("utf8")
    );
    if (!payload.userId || !Array.isArray(payload.canales)) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
