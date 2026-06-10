declare module "@/services/pawpatroll-ws/lib/canales-para-evento.mjs" {
  export function canalesParaEvento(
    evento: Record<string, unknown> & { tipo: string }
  ): string[];
}

declare module "@/services/pawpatroll-ws/lib/token-ws.mjs" {
  export function crearTokenSuscripcionWs(
    userId: string,
    canales: string[],
    ttlSegundos?: number
  ): string | null;

  export function verificarTokenSuscripcionWs(token: string): {
    userId: string;
    canales: string[];
    exp: number;
  } | null;
}
