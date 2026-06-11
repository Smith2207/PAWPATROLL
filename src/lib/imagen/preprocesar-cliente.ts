/** Máximo lado en px para fotos subidas desde el navegador */
const LADO_MAXIMO = 1200;
const CALIDAD_JPEG = 0.85;

function cargarImagen(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo leer la imagen"));
    img.src = dataUrl;
  });
}

/**
 * Redimensiona y comprime en el cliente (cuadrado opcional con recorte centrado).
 * Reduce peso en borradores sessionStorage y tarjetas del mapa.
 */
export async function preprocesarImagenCliente(
  dataUrl: string,
  opciones?: { ladoMax?: number; calidad?: number; cuadrado?: boolean }
): Promise<string> {
  if (!dataUrl.startsWith("data:image/")) return dataUrl;

  const ladoMax = opciones?.ladoMax ?? LADO_MAXIMO;
  const calidad = opciones?.calidad ?? CALIDAD_JPEG;
  const cuadrado = opciones?.cuadrado ?? false;

  try {
    const img = await cargarImagen(dataUrl);
    let ancho = img.naturalWidth;
    let alto = img.naturalHeight;
    if (ancho < 1 || alto < 1) return dataUrl;

    if (cuadrado) {
      const lado = Math.min(ancho, alto);
      const sx = (ancho - lado) / 2;
      const sy = (alto - lado) / 2;
      ancho = lado;
      alto = lado;
      const canvas = document.createElement("canvas");
      const salida = Math.min(lado, ladoMax);
      canvas.width = salida;
      canvas.height = salida;
      const ctx = canvas.getContext("2d");
      if (!ctx) return dataUrl;
      ctx.drawImage(img, sx, sy, lado, lado, 0, 0, salida, salida);
      return canvas.toDataURL("image/jpeg", calidad);
    }

    const escala = Math.min(1, ladoMax / Math.max(ancho, alto));
    const w = Math.round(ancho * escala);
    const h = Math.round(alto * escala);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", calidad);
  } catch {
    return dataUrl;
  }
}

export async function preprocesarImagenesCliente(
  dataUrls: string[]
): Promise<string[]> {
  return Promise.all(dataUrls.map((u) => preprocesarImagenCliente(u)));
}

/** Recorte cuadrado centrado para fotos de avistamiento antes de publicar. */
export async function preprocesarFotoAvistamiento(
  fotoUrl: string | undefined | null
): Promise<string | undefined> {
  if (!fotoUrl) return undefined;
  return preprocesarImagenCliente(fotoUrl, { cuadrado: true });
}
