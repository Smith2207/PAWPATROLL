declare module "@/services/pawpatroll-ws/lib/canales-para-evento.mjs" {
  export function canalesParaEvento(
    evento: Record<string, unknown> & { tipo: string }
  ): string[];
}
