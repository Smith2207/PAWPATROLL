/**
 * Compartir alertas de mascota perdida.
 */
export function urlPaginaMascota(slug: string, origen?: string): string {
  const base =
    origen?.replace(/\/$/, "") ??
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/mascota/${slug}`;
}

export function abrirCompartirWhatsAppAlerta(
  slug: string,
  origen?: string
): void {
  if (typeof window === "undefined") return;
  const url = urlPaginaMascota(slug, origen);
  const texto = encodeURIComponent(
    `Ayúdame a encontrar a mi mascota. Mira la alerta en PawPatrol: ${url}`
  );
  window.open(`https://wa.me/?text=${texto}`, "_blank", "noopener,noreferrer");
}
