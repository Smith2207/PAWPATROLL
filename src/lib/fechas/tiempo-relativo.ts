export type VarianteTiempoRelativo = "chat" | "feed" | "notificacion" | "compacto";

function msDesde(fecha: Date | string | number): number {
  return Date.now() - new Date(fecha).getTime();
}

/** Tiempo relativo en español; variante según contexto de UI */
export function tiempoRelativo(
  fecha: Date | string | number,
  variante: VarianteTiempoRelativo = "feed"
): string {
  const diff = msDesde(fecha);
  const min = Math.floor(diff / 60_000);

  if (variante === "compacto") {
    const horas = Math.floor(diff / 3_600_000);
    if (horas < 1) return "hace unos minutos";
    if (horas < 24) return `hace ${horas}h`;
    return `hace ${Math.floor(horas / 24)}d`;
  }

  const ahora = variante === "chat" ? "Ahora" : "ahora";
  const prefijo = variante === "chat" ? "Hace" : "hace";

  if (min < 1) return ahora;
  if (min < 60) return `${prefijo} ${min} min`;

  const h = Math.floor(min / 60);
  if (h < 24) return `${prefijo} ${h} h`;

  if (variante === "notificacion") {
    return new Date(fecha).toLocaleDateString("es-PE");
  }

  const d = Math.floor(h / 24);

  if (variante === "chat") {
    if (d < 7) return `${prefijo} ${d} d`;
    return new Date(fecha).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
    });
  }

  return `${prefijo} ${d} d`;
}

/** Alias para listas de chat (mayúscula inicial, fecha corta tras 7 días) */
export function horaRelativaChat(fecha: Date | string | number): string {
  return tiempoRelativo(fecha, "chat");
}
