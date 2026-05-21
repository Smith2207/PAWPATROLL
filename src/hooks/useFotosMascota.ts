"use client";

import { useCallback, useState } from "react";

const MAX_FOTOS = 5;

function leerArchivo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function useFotosMascota(fotosIniciales: string[] = []) {
  const [fotos, setFotos] = useState<string[]>(fotosIniciales);

  const agregarDesdeInput = useCallback(
    async (input: HTMLInputElement | null) => {
      if (!input?.files?.length) return;

      const restantes = MAX_FOTOS - fotos.length;
      if (restantes <= 0) return;

      const archivos = Array.from(input.files).slice(0, restantes);
      const nuevas = await Promise.all(archivos.map(leerArchivo));
      setFotos((prev) => [...prev, ...nuevas].slice(0, MAX_FOTOS));
      input.value = "";
    },
    [fotos.length]
  );

  const quitar = useCallback((indice: number) => {
    setFotos((prev) => prev.filter((_, i) => i !== indice));
  }, []);

  const marcarPrincipal = useCallback((indice: number) => {
    setFotos((prev) => {
      const copia = [...prev];
      const [foto] = copia.splice(indice, 1);
      if (!foto) return prev;
      return [foto, ...copia];
    });
  }, []);

  const reemplazar = useCallback((nuevas: string[]) => {
    setFotos(nuevas.slice(0, MAX_FOTOS));
  }, []);

  return {
    fotos,
    setFotos: reemplazar,
    agregarDesdeInput,
    quitar,
    marcarPrincipal,
    maxFotos: MAX_FOTOS,
    puedeAgregar: fotos.length < MAX_FOTOS,
  };
}
