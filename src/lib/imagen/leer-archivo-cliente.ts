/**
 * Lectura de archivos de imagen en el navegador (data URL).
 */
import { MENSAJE_IMAGEN_ILEGIBLE } from "@/lib/imagen/validar-archivo";

export function leerArchivoComoDataUrl(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        resolve(result);
        return;
      }
      reject(new Error(MENSAJE_IMAGEN_ILEGIBLE));
    };
    reader.onerror = () => reject(new Error(MENSAJE_IMAGEN_ILEGIBLE));
    reader.readAsDataURL(archivo);
  });
}

export function leerArchivosComoDataUrl(archivos: File[]): Promise<string[]> {
  return Promise.all(archivos.map((archivo) => leerArchivoComoDataUrl(archivo)));
}
