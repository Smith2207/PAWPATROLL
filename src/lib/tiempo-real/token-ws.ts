import type { CanalTiempoReal } from "@/lib/tiempo-real/tipos";
import {
  crearTokenSuscripcionWs as crearTokenCompartido,
  verificarTokenSuscripcionWs as verificarTokenCompartido,
} from "@/services/pawpatroll-ws/lib/token-ws.mjs";

type PayloadWs = {
  userId: string;
  canales: CanalTiempoReal[];
  exp: number;
};

export function crearTokenSuscripcionWs(
  userId: string,
  canales: CanalTiempoReal[],
  ttlSegundos = 300
): string | null {
  return crearTokenCompartido(userId, canales, ttlSegundos);
}

export function verificarTokenSuscripcionWs(token: string): PayloadWs | null {
  return verificarTokenCompartido(token) as PayloadWs | null;
}
