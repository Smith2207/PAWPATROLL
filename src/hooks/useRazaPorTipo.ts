"use client";



/**
 * Hook React: raza por tipo.
 */
/**
 * Hook React: raza por tipo.
 */
import { useCallback, useState } from "react";
import {
  componerRaza,
  obtenerRazasPorTipo,
  OPCION_RAZA_OTRA,
  parsearRaza,
} from "@/lib/mascotas/razas";

/** Estado compartido tipo + raza; limpia raza al cambiar tipo si ya no aplica. */
export function useRazaPorTipo(tipoInicial = "", razaInicial?: string | null) {
  const [tipo, setTipo] = useState(tipoInicial);
  const razaParseada = parsearRaza(tipoInicial, razaInicial);
  const [razaSeleccion, setRazaSeleccion] = useState(razaParseada.seleccion);
  const [razaOtra, setRazaOtra] = useState(razaParseada.otra);

  const onTipoChange = useCallback((nuevoTipo: string) => {
    setTipo(nuevoTipo);
    setRazaSeleccion((prev) => {
      if (
        prev &&
        prev !== OPCION_RAZA_OTRA &&
        !obtenerRazasPorTipo(nuevoTipo).includes(prev)
      ) {
        setRazaOtra("");
        return "";
      }
      return prev;
    });
  }, []);

  const razaCompuesta = componerRaza(razaSeleccion, razaOtra);

  return {
    tipo,
    setTipo,
    razaSeleccion,
    setRazaSeleccion,
    razaOtra,
    setRazaOtra,
    onTipoChange,
    razaCompuesta,
  };
}
