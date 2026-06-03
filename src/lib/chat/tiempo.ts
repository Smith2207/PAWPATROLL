/** Hora relativa compacta para listas de chat */
export function horaRelativaChat(fecha: Date): string {
  const diff = Date.now() - new Date(fecha).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "Ahora";
  if (min < 60) return `Hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `Hace ${d} d`;
  return new Date(fecha).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
  });
}
