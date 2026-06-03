import type { MensajeAvistamiento } from "@/lib/db/schema";

export function esImagenAdjunta(url: string | null | undefined): boolean {
  return urlParaMostrarAdjunto(url) != null;
}

/** URL usable en `<img>`; descarta data URLs truncadas o inválidas. */
export function urlParaMostrarAdjunto(
  url: string | null | undefined
): string | null {
  if (!url?.trim()) return null;
  const u = url.trim();
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  const match = /^data:image\/([\w+.-]+);base64,([A-Za-z0-9+/=]+)$/i.exec(u);
  if (!match) return null;
  const b64 = match[2];
  if (b64.length < 80) return null;
  try {
    atob(b64.slice(0, 24));
  } catch {
    return null;
  }
  return u;
}

/** Texto visible en lista de conversaciones */
export function previewMensajeChat(m: Pick<MensajeAvistamiento, "contenido" | "adjuntoUrl">): string {
  const texto = m.contenido.trim();
  if (texto && texto !== "📷 Foto") return texto;
  if (esImagenAdjunta(m.adjuntoUrl)) return "📷 Foto";
  return texto || "Mensaje";
}

export function esMensajePropio(
  m: Pick<MensajeAvistamiento, "userId">,
  miUserId: string | undefined
): boolean {
  return Boolean(miUserId && m.userId && m.userId === miUserId);
}

export function etiquetaFechaChat(fecha: Date): string {
  const hoy = new Date();
  const ayer = new Date(hoy);
  ayer.setDate(hoy.getDate() - 1);

  const mismaFecha = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (mismaFecha(fecha, hoy)) return "Hoy";
  if (mismaFecha(fecha, ayer)) return "Ayer";

  return fecha.toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/** Hora compacta para burbujas (evita saltos por «p. m.» con espacios extra) */
export function formatearHoraMensaje(fecha: Date): string {
  const h = fecha.getHours();
  const m = fecha.getMinutes().toString().padStart(2, "0");
  const h12 = h % 12 || 12;
  const periodo = h < 12 ? "a.m." : "p.m.";
  return `${h12}:${m} ${periodo}`;
}

export function mostrarSeparadorFecha(
  actual: Date,
  anterior: Date | undefined
): boolean {
  if (!anterior) return true;
  return (
    actual.getFullYear() !== anterior.getFullYear() ||
    actual.getMonth() !== anterior.getMonth() ||
    actual.getDate() !== anterior.getDate()
  );
}
