"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { preprocesarImagenesCliente } from "@/lib/imagen/preprocesar-cliente";
import {
  MENSAJE_IMAGEN_ILEGIBLE,
  validarArchivoImagen,
  validarDataUrlImagen,
} from "@/lib/imagen/validar-archivo";

const MAX_BYTES_POR_DEFECTO = 8 * 1024 * 1024;

type Opciones = {
  /** Prefijo para ids de video/canvas (evita colisiones entre modales) */
  idPrefijo?: string;
  maxFotos?: number;
  maxBytesArchivo?: number;
};

export function useCamaraReporte(opciones: Opciones = {}) {
  const idPrefijo = opciones.idPrefijo ?? "reporte";
  const maxFotos = opciones.maxFotos ?? 5;
  const maxBytesArchivo = opciones.maxBytesArchivo ?? MAX_BYTES_POR_DEFECTO;
  const ids = useMemo(
    () => ({
      video: `camara-video-${idPrefijo}`,
      canvas: `camara-canvas-${idPrefijo}`,
    }),
    [idPrefijo]
  );

  const streamRef = useRef<MediaStream | null>(null);
  const [fotosPreview, setFotosPreview] = useState<string[]>([]);
  const fotosPreviewRef = useRef<string[]>([]);
  useEffect(() => {
    fotosPreviewRef.current = fotosPreview;
  }, [fotosPreview]);
  const [camaraVisible, setCamaraVisible] = useState(false);
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);

  const previewFotos = useCallback(
    (input: HTMLInputElement) => {
      const files = Array.from(input.files ?? []);
      input.value = "";
      if (!files.length) return;

      const prev = fotosPreviewRef.current;
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
            setFotosPreview(procesadas.slice(0, 1));
            return;
          }
          setFotosPreview((actual) =>
            [...actual, ...procesadas].slice(0, maxFotos)
          );
        } catch (err) {
          setErrorArchivo(
            err instanceof Error ? err.message : MENSAJE_IMAGEN_ILEGIBLE
          );
        }
      })();
    },
    [maxBytesArchivo, maxFotos]
  );

  const cerrarStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const abrirCamara = useCallback(async () => {
    const video = document.getElementById(ids.video) as HTMLVideoElement | null;
    if (!video) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      video.srcObject = stream;
      setCamaraVisible(true);
    } catch {
      alert(
        "No se pudo acceder a la cámara. Verifica los permisos del navegador."
      );
    }
  }, [ids.video]);

  const capturarFoto = useCallback(() => {
    const video = document.getElementById(ids.video) as HTMLVideoElement | null;
    const canvas = document.getElementById(ids.canvas) as HTMLCanvasElement | null;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

    cerrarStream();
    setCamaraVisible(false);
    void preprocesarImagenesCliente([dataUrl]).then(([procesada]) => {
      setFotosPreview((prev) => [...prev, procesada].slice(0, maxFotos));
    });
  }, [cerrarStream, ids.video, ids.canvas, maxFotos]);

  const cerrarCamara = useCallback(() => {
    cerrarStream();
    setCamaraVisible(false);
  }, [cerrarStream]);

  const limpiarFotos = useCallback(() => {
    setFotosPreview([]);
    setErrorArchivo(null);
  }, []);

  const limpiarErrorArchivo = useCallback(() => setErrorArchivo(null), []);

  const quitarFoto = useCallback((indice: number) => {
    setFotosPreview((prev) => prev.filter((_, i) => i !== indice));
  }, []);

  const marcarPrincipal = useCallback((indice: number) => {
    setFotosPreview((prev) => {
      const copia = [...prev];
      const [foto] = copia.splice(indice, 1);
      if (!foto) return prev;
      return [foto, ...copia];
    });
  }, []);

  const establecerFotos = useCallback(
    (fotos: string[]) => {
      void preprocesarImagenesCliente(fotos).then((procesadas) =>
        setFotosPreview(procesadas.slice(0, maxFotos))
      );
    },
    [maxFotos]
  );

  return {
    fotosPreview,
    camaraVisible,
    errorArchivo,
    previewFotos,
    abrirCamara,
    capturarFoto,
    cerrarCamara,
    limpiarFotos,
    limpiarErrorArchivo,
    quitarFoto,
    marcarPrincipal,
    establecerFotos,
    ids,
    maxFotos,
  };
}

export type CamaraReporteApi = ReturnType<typeof useCamaraReporte>;
