"use client";



/**
 * Hook React: ubicacion reporte.
 */
import { useState } from "react";
import type { UbicacionSeleccionada } from "@/lib/geo/tipos";

/** Estado compartido de mapa + dirección en modales de reporte. */
export function useUbicacionReporte() {
  const [ubicacion, setUbicacion] = useState<UbicacionSeleccionada | null>(null);
  const [direccion, setDireccion] = useState("");

  function limpiarUbicacion() {
    setUbicacion(null);
    setDireccion("");
  }

  return {
    ubicacion,
    setUbicacion,
    direccion,
    setDireccion,
    limpiarUbicacion,
  };
}
