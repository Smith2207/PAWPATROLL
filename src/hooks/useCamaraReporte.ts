"use client";

import { useCallback, useRef, useState } from "react";

export function useCamaraReporte() {
  const streamRef = useRef<MediaStream | null>(null);
  const [fotosPreview, setFotosPreview] = useState<string[]>([]);
  const [camaraVisible, setCamaraVisible] = useState(false);
  const [iaResultadoVisible, setIaResultadoVisible] = useState(false);
  const [iaPreview, setIaPreview] = useState("");
  const [iaProgreso, setIaProgreso] = useState(0);
  const [iaTexto, setIaTexto] = useState(
    "Detectando raza, color y características únicas"
  );

  const previewFotos = useCallback((input: HTMLInputElement) => {
    const files = Array.from(input.files ?? []).slice(0, 5);
    const lecturas = files.map(
      (file) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        })
    );
    void Promise.all(lecturas).then(setFotosPreview);
  }, []);

  const cerrarStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const abrirCamara = useCallback(async () => {
    const video = document.getElementById(
      "camara-video-reporte"
    ) as HTMLVideoElement | null;
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
  }, []);

  const capturarFoto = useCallback(() => {
    const video = document.getElementById(
      "camara-video-reporte"
    ) as HTMLVideoElement | null;
    const canvas = document.getElementById(
      "camara-canvas-reporte"
    ) as HTMLCanvasElement | null;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

    cerrarStream();
    setCamaraVisible(false);
    setIaPreview(dataUrl);
    setIaResultadoVisible(true);
    setIaProgreso(0);
    setIaTexto("Detectando raza, color y características únicas");

    setTimeout(() => setIaProgreso(100), 100);
    setTimeout(
      () =>
        setIaTexto(
          "Raza probable: Golden Retriever · Color: dorado · 87% confianza"
        ),
      2100
    );
  }, [cerrarStream]);

  const cerrarCamara = useCallback(() => {
    cerrarStream();
    setCamaraVisible(false);
  }, [cerrarStream]);

  const ocultarResultadoIa = useCallback(() => {
    setIaResultadoVisible(false);
  }, []);

  return {
    fotosPreview,
    camaraVisible,
    iaResultadoVisible,
    iaPreview,
    iaProgreso,
    iaTexto,
    previewFotos,
    abrirCamara,
    capturarFoto,
    cerrarCamara,
    ocultarResultadoIa,
  };
}
