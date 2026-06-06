import { createHmac, timingSafeEqual } from "node:crypto";
import type { CanalTiempoReal } from "@/lib/tiempo-real/tipos";

type PayloadWs = {
  userId: string;
  canales: CanalTiempoReal[];
  exp: number;
};

function secretoWs(): string | null {
  return (
    process.env.WS_PUBLISH_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    null
  );
}

function firmar(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function crearTokenSuscripcionWs(
  userId: string,
  canales: CanalTiempoReal[],
  ttlSegundos = 300
): string | null {
  const secret = secretoWs();
  if (!secret) return null;

  const payload: PayloadWs = {
    userId,
    canales: [...new Set(canales)],
    exp: Math.floor(Date.now() / 1000) + ttlSegundos,
  };

  const cuerpo = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const firma = firmar(cuerpo, secret);
  return `${cuerpo}.${firma}`;
}

export function verificarTokenSuscripcionWs(token: string): PayloadWs | null {
  const secret = secretoWs();
  if (!secret) return null;

  const [cuerpo, firma] = token.split(".");
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
    ) as PayloadWs;
    if (!payload.userId || !Array.isArray(payload.canales)) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
