"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { preprocesarImagenesCliente } from "@/lib/imagen/preprocesar-cliente";

type Opciones = {
  /** Prefijo para ids de video/canvas (evita colisiones entre modales) */
  idPrefijo?: string;
  maxFotos?: number;
};

export function useCamaraReporte(opciones: Opciones = {}) {
  const idPrefijo = opciones.idPrefijo ?? "reporte";
  const maxFotos = opciones.maxFotos ?? 5;
  const ids = useMemo(
    () => ({
      video: `camara-video-${idPrefijo}`,
      canvas: `camara-canvas-${idPrefijo}`,
    }),
    [idPrefijo]
  );

  const streamRef = useRef<MediaStream | null>(null);
  const [fotosPreview, setFotosPreview] = useState<string[]>([]);
  const [camaraVisible, setCamaraVisible] = useState(false);

  const previewFotos = useCallback((input: HTMLInputElement) => {
    const files = Array.from(input.files ?? []).slice(0, maxFotos);
    const lecturas = files.map(
      (file) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        })
    );
    void Promise.all(lecturas)
      .then((urls) => preprocesarImagenesCliente(urls))
      .then((procesadas) => {
        if (maxFotos <= 1) {
          setFotosPreview(procesadas.slice(0, 1));
          return;
        }
        setFotosPreview((prev) =>
          [...prev, ...procesadas].slice(0, maxFotos)
        );
      });
  }, [maxFotos]);

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

  const limpiarFotos = useCallback(() => setFotosPreview([]), []);

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
    previewFotos,
    abrirCamara,
    capturarFoto,
    cerrarCamara,
    limpiarFotos,
    establecerFotos,
    ids,
    maxFotos,
  };
}
