/** Las fotos subidas (data URL) no pueden ir en el JWT: rompen la cookie (~4 KB máx). */
export function imagenParaJwt(image: string | null | undefined): string | null {
  if (!image) return null;
  if (image.startsWith("data:image/")) return null;
  return image;
}
