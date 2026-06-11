"use client";



/**
 * Hook React: solicitud ubicacion.
 */
import { useCallback, useEffect, useState } from "react";
import { DialogoPermisoUbicacion } from "@/componentes/geo/DialogoPermisoUbicacion";
import type { ResultadoUbicacion } from "@/hooks/useGeolocalizacion";
import {
  consultarPermisoUbicacion,
  type EstadoPermisoUbicacion,
} from "@/lib/geo/permiso-ubicacion";

type Opciones = {
  obtenerUbicacion: () => Promise<ResultadoUbicacion>;
  /** Se invoca al obtener ubicación (permiso ya concedido o tras confirmar el diálogo). */
  onResultado?: (resultado: ResultadoUbicacion) => void;
};

/**
 * Muestra un diálogo tipo Rappi antes de pedir GPS (salvo si el permiso ya está concedido).
 * El confirmar debe ejecutarse desde un clic del usuario para cumplir políticas del navegador.
 */
export function useSolicitudUbicacion({ obtenerUbicacion, onResultado }: Opciones) {
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [estadoPermiso, setEstadoPermiso] =
    useState<EstadoPermisoUbicacion>("prompt");
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    void consultarPermisoUbicacion().then(setEstadoPermiso);
  }, []);

  const cerrarDialogo = useCallback(() => {
    if (confirmando) return;
    setDialogoAbierto(false);
  }, [confirmando]);

  const confirmarUbicacion = useCallback(() => {
    setConfirmando(true);
    void obtenerUbicacion()
      .then((resultado) => {
        onResultado?.(resultado);
        if (resultado.ok) {
          setDialogoAbierto(false);
          void consultarPermisoUbicacion().then(setEstadoPermiso);
          return;
        }
        void consultarPermisoUbicacion().then((estado) => {
          setEstadoPermiso(estado);
          if (estado === "denied") setDialogoAbierto(true);
        });
      })
      .finally(() => setConfirmando(false));
  }, [obtenerUbicacion, onResultado]);

  const solicitarUbicacion = useCallback(async () => {
    const estado = await consultarPermisoUbicacion();
    setEstadoPermiso(estado);

    if (estado === "granted") {
      return obtenerUbicacion();
    }

    setDialogoAbierto(true);
    return null;
  }, [obtenerUbicacion]);

  const dialogoPermiso = (
    <DialogoPermisoUbicacion
      abierto={dialogoAbierto}
      estadoPermiso={estadoPermiso}
      cargando={confirmando}
      onConfirmar={confirmarUbicacion}
      onCerrar={cerrarDialogo}
    />
  );

  return {
    solicitarUbicacion,
    confirmarUbicacion,
    dialogoPermiso,
    estadoPermiso,
  };
}
