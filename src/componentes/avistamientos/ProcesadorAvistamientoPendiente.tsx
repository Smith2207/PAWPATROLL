"use client";

import { crearAvistamiento } from "@/actions/avistamientos";
import { useModales } from "@/contexto/ContextoModales";
import {
  guardarExitoAvistamiento,
  hayAvistamientoPendienteAuth,
  leerBorradorAvistamiento,
  limpiarBorradorAvistamiento,
} from "@/lib/avistamientos/borrador-cliente";
import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/** Tras iniciar sesión, envía el borrador del avistamiento guardado en el cliente. */
export function ProcesadorAvistamientoPendiente() {
  const { status } = useSession();
  const router = useRouter();
  const {
    avistamientoPendienteAuth,
    setAvistamientoPendienteAuth,
    setPublicandoReporte,
    cerrarModal,
    abrirModal,
  } = useModales();
  const procesando = useRef(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!avistamientoPendienteAuth && !hayAvistamientoPendienteAuth()) return;
    if (procesando.current) return;

    const borrador = leerBorradorAvistamiento();
    if (!borrador) {
      setAvistamientoPendienteAuth(false);
      return;
    }

    procesando.current = true;
    cerrarModal("login");
    cerrarModal("registro");
    abrirModal("sighting");
    setPublicandoReporte("avistamiento");

    void (async () => {
      const resultado = await crearAvistamiento(borrador.datos);

      procesando.current = false;
      setPublicandoReporte(null);
      setAvistamientoPendienteAuth(false);

      if (!resultado.ok) {
        guardarExitoAvistamiento({
          mensaje:
            resultado.error ??
            "No se pudo publicar el avistamiento. Revisa el formulario e inténtalo de nuevo.",
        });
        window.dispatchEvent(new CustomEvent("pawpatroll:reporte-publicado"));
        return;
      }

      limpiarBorradorAvistamiento();

      guardarExitoAvistamiento({
        mensaje:
          resultado.mensaje ??
          `Avistamiento #${resultado.numeroReporte} publicado correctamente.`,
        numeroReporte: resultado.numeroReporte,
      });

      window.dispatchEvent(new CustomEvent("pawpatroll:reporte-publicado"));
      router.refresh();
    })();
  }, [
    status,
    avistamientoPendienteAuth,
    setAvistamientoPendienteAuth,
    setPublicandoReporte,
    cerrarModal,
    abrirModal,
    router,
  ]);

  return null;
}
