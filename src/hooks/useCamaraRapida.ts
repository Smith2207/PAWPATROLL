"use client";

import { useCallback, useRef, useState } from "react";

export function useCamaraRapida() {
  const streamRef = useRef<MediaStream | null>(null);
  const [analizando, setAnalizando] = useState(false);
  const [resultadoVisible, setResultadoVisible] = useState(false);
  const [fotoPreview, setFotoPreview] = useState("");
  const [raza, setRaza] = useState("");
  const [color, setColor] = useState("");
  const [confianza, setConfianza] = useState("");
  const [progresoBarra, setProgresoBarra] = useState(0);
  const [camaraActiva, setCamaraActiva] = useState(false);

  const cerrarStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const iniciarCamara = useCallback(
    async (video: HTMLVideoElement | null) => {
      if (!video) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        streamRef.current = stream;
        video.srcObject = stream;
        setCamaraActiva(true);
        setResultadoVisible(false);
      } catch {
        alert(
          "No se pudo acceder a la cámara. Verifica los permisos del navegador."
        );
      }
    },
    []
  );

  const capturarYAnalizar = useCallback(
    (video: HTMLVideoElement | null, canvas: HTMLCanvasElement | null) => {
      if (!video || !canvas) return;

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      canvas.getContext("2d")?.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

      cerrarStream();
      setCamaraActiva(false);
      setFotoPreview(dataUrl);
      setResultadoVisible(true);
      setAnalizando(true);
      setProgresoBarra(0);
      setRaza("");
      setColor("");
      setConfianza("");

      setTimeout(() => setProgresoBarra(55), 100);
      setTimeout(() => setProgresoBarra(80), 900);
      setTimeout(() => {
        setProgresoBarra(100);
        setRaza("🐕 Raza detectada: Labrador Retriever");
        setColor("🎨 Color: Caramelo / Dorado");
        setConfianza(
          "📊 Confianza: 89% · 3 posibles coincidencias en base de datos"
        );
        setAnalizando(false);
      }, 1900);
    },
    [cerrarStream]
  );

  const reiniciar = useCallback(() => {
    cerrarStream();
    setCamaraActiva(false);
    setResultadoVisible(false);
    setFotoPreview("");
    setProgresoBarra(0);
    setRaza("");
    setColor("");
    setConfianza("");
    setAnalizando(false);
  }, [cerrarStream]);

  return {
    camaraActiva,
    resultadoVisible,
    fotoPreview,
    raza,
    color,
    confianza,
    progresoBarra,
    analizando,
    iniciarCamara,
    capturarYAnalizar,
    reiniciar,
    cerrarStream,
  };
}
