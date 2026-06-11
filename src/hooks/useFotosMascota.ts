"use client";



/**
 * Hook React: fotos mascota.
 */
/**
 * Hook React: fotos mascota.
 */
import { useCallback, useRef, useState } from "react";
import { preprocesarImagenesCliente } from "@/lib/imagen/preprocesar-cliente";
import {
  MENSAJE_IMAGEN_ILEGIBLE,
  validarArchivoImagen,
  validarDataUrlImagen,
} from "@/lib/imagen/validar-archivo";

const MAX_FOTOS_DEFECTO = 5;
const MAX_BYTES_DEFECTO = 8 * 1024 * 1024;

type OpcionesFotosMascota = {
  maxFotos?: number;
  maxBytesArchivo?: number;
  /** Modo controlado (p. ej. ficha de mascota) */
  fotos?: string[];
  onFotosChange?: (fotos: string[]) => void;
};

/**
 * Estado y validación compartidos para galerías de fotos de mascota.
 * Usado por useCamaraReporte, SubirFotosMascota y FormularioFotosMascota.
 */
export function useFotosMascota(opciones: OpcionesFotosMascota = {}) {
  const maxFotos = opciones.maxFotos ?? MAX_FOTOS_DEFECTO;
  const maxBytesArchivo = opciones.maxBytesArchivo ?? MAX_BYTES_DEFECTO;
  const onFotosChange = opciones.onFotosChange;
  const fotosControladas = opciones.fotos;
  const controlado =
    fotosControladas !== undefined && onFotosChange !== undefined;

  const [fotosInternas, setFotosInternas] = useState<string[]>([]);
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);

  const fotos = controlado ? fotosControladas! : fotosInternas;
  const fotosRef = useRef(fotos);
  fotosRef.current = fotos;

  const aplicarFotos = useCallback(
    (siguiente: string[]) => {
      const recortadas = siguiente.slice(0, maxFotos);
      if (controlado) {
        onFotosChange!(recortadas);
      } else {
        setFotosInternas(recortadas);
      }
    },
    [controlado, maxFotos, onFotosChange]
  );

  const previewFotos = useCallback(
    (input: HTMLInputElement) => {
      const files = Array.from(input.files ?? []);
      input.value = "";
      if (!files.length) return;

      const prev = fotosRef.current;
      const cupo =
        maxFotos <= 1 ? 1 : Math.max(0, maxFotos - prev.length);
      if (cupo <= 0) return;

      const archivos = files.slice(0, cupo);

      for (const archivo of archivos) {
        const validacion = validarArchivoImagen(archivo, {
          maxBytes: maxBytesArchivo,
        });
        if (!validacion.ok) {
          setErrorArchivo(validacion.error);
          return;
        }
      }

      void (async () => {
        try {
          const urls = await Promise.all(
            archivos.map(
              (file) =>
                new Promise<string>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    const dataUrl = e.target?.result as string;
                    const okData = validarDataUrlImagen(dataUrl);
                    if (!okData.ok) {
                      reject(new Error(okData.error));
                      return;
                    }
                    resolve(dataUrl);
                  };
                  reader.onerror = () =>
                    reject(new Error(MENSAJE_IMAGEN_ILEGIBLE));
                  reader.readAsDataURL(file);
                })
            )
          );
          const procesadas = await preprocesarImagenesCliente(urls);
          setErrorArchivo(null);
          if (maxFotos <= 1) {
            aplicarFotos(procesadas.slice(0, 1));
            return;
          }
          aplicarFotos([...prev, ...procesadas].slice(0, maxFotos));
        } catch (err) {
          setErrorArchivo(
            err instanceof Error ? err.message : MENSAJE_IMAGEN_ILEGIBLE
          );
        }
      })();
    },
    [aplicarFotos, maxBytesArchivo, maxFotos]
  );

  const agregarFotosProcesadas = useCallback(
    (nuevas: string[]) => {
      void preprocesarImagenesCliente(nuevas).then((procesadas) => {
        const prev = fotosRef.current;
        if (maxFotos <= 1) {
          aplicarFotos(procesadas.slice(0, 1));
          return;
        }
        aplicarFotos([...prev, ...procesadas].slice(0, maxFotos));
      });
    },
    [aplicarFotos, maxFotos]
  );

  const limpiarFotos = useCallback(() => {
    aplicarFotos([]);
    setErrorArchivo(null);
  }, [aplicarFotos]);

  const limpiarErrorArchivo = useCallback(() => setErrorArchivo(null), []);

  const quitarFoto = useCallback(
    (indice: number) => {
      aplicarFotos(fotosRef.current.filter((_, i) => i !== indice));
    },
    [aplicarFotos]
  );

  const marcarPrincipal = useCallback(
    (indice: number) => {
      const copia = [...fotosRef.current];
      const [foto] = copia.splice(indice, 1);
      if (!foto) return;
      aplicarFotos([foto, ...copia]);
    },
    [aplicarFotos]
  );

  const establecerFotos = useCallback(
    (lista: string[]) => {
      void preprocesarImagenesCliente(lista).then((procesadas) =>
        aplicarFotos(procesadas.slice(0, maxFotos))
      );
    },
    [aplicarFotos, maxFotos]
  );

  return {
    fotos,
    fotosPreview: fotos,
    maxFotos,
    errorArchivo,
    previewFotos,
    agregarFotosProcesadas,
    limpiarFotos,
    limpiarErrorArchivo,
    quitarFoto,
    marcarPrincipal,
    establecerFotos,
  };
}

export type FotosMascotaApi = ReturnType<typeof useFotosMascota>;
