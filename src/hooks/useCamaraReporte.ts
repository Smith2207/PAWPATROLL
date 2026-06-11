"use client";



/**
 * Hook React: camara reporte.
 */
import { useCallback, useMemo, useRef, useState } from "react";
import { useFotosMascota } from "@/hooks/useFotosMascota";

type Opciones = {
  /** Prefijo para ids de video/canvas (evita colisiones entre modales) */
  idPrefijo?: string;
  maxFotos?: number;
  maxBytesArchivo?: number;
};

export function useCamaraReporte(opciones: Opciones = {}) {
  const idPrefijo = opciones.idPrefijo ?? "reporte";
  const maxFotos = opciones.maxFotos ?? 5;

  const fotos = useFotosMascota({
    maxFotos,
    maxBytesArchivo: opciones.maxBytesArchivo,
  });

  const ids = useMemo(
    () => ({
      video: `camara-video-${idPrefijo}`,
      canvas: `camara-canvas-${idPrefijo}`,
    }),
    [idPrefijo]
  );

  const streamRef = useRef<MediaStream | null>(null);
  const [camaraVisible, setCamaraVisible] = useState(false);

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

  const { agregarFotosProcesadas } = fotos;

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
    agregarFotosProcesadas([dataUrl]);
  }, [agregarFotosProcesadas, cerrarStream, ids.canvas, ids.video]);

  const cerrarCamara = useCallback(() => {
    cerrarStream();
    setCamaraVisible(false);
  }, [cerrarStream]);

  return {
    ...fotos,
    camaraVisible,
    abrirCamara,
    capturarFoto,
    cerrarCamara,
    ids,
  };
}

export type CamaraReporteApi = ReturnType<typeof useCamaraReporte>;
