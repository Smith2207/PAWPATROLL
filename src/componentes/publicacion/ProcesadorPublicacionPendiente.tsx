"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { crearAvistamiento } from "@/actions/avistamientos";
import { useModales, type TipoModal } from "@/contexto/ContextoModales";
import {
  guardarExitoAvistamiento,
  hayAvistamientoPendienteAuth,
  leerBorradorAvistamiento,
  limpiarBorradorAvistamiento,
} from "@/lib/avistamientos/borrador-cliente";
import {
  guardarExitoPerdida,
  hayPerdidaPendienteAuth,
  leerBorradorPerdida,
  limpiarBorradorPerdida,
} from "@/lib/perdidas/borrador-cliente";
import { publicarReportePerdida } from "@/lib/perdidas/publicar-reporte";
import { emitirReportePublicado } from "@/lib/eventos-cliente";

type TipoPublicacion = "avistamiento" | "perdida";

function usePublicacionPendienteAuth<T>({
  tipo,
  modal,
  flagContexto,
  setFlagContexto,
  hayPendiente,
  leerBorrador,
  limpiarBorrador,
  publicar,
  guardarExito,
  mensajeErrorFallback,
  mensajeExitoFallback,
}: {
  tipo: TipoPublicacion;
  modal: TipoModal;
  flagContexto: boolean;
  setFlagContexto: (valor: boolean) => void;
  hayPendiente: () => boolean;
  leerBorrador: () => T | null;
  limpiarBorrador: () => void;
  publicar: (borrador: T) => Promise<{
    ok: boolean;
    error?: string;
    mensaje?: string;
    numeroReporte?: number;
    slug?: string;
  }>;
  guardarExito: (exito: {
    mensaje: string;
    numeroReporte?: number;
    slug?: string;
  }) => void;
  mensajeErrorFallback: string;
  mensajeExitoFallback: (resultado: {
    numeroReporte?: number;
    mensaje?: string;
  }) => string;
}) {
  const { status } = useSession();
  const router = useRouter();
  const { setPublicandoReporte, cerrarModal, abrirModal } = useModales();
  const procesando = useRef(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!flagContexto && !hayPendiente()) return;
    if (procesando.current) return;

    const borrador = leerBorrador();
    if (!borrador) {
      setFlagContexto(false);
      return;
    }

    procesando.current = true;
    cerrarModal("login");
    cerrarModal("registro");
    abrirModal(modal);
    setPublicandoReporte(tipo);

    void (async () => {
      const resultado = await publicar(borrador);

      procesando.current = false;
      setPublicandoReporte(null);
      setFlagContexto(false);

      if (!resultado.ok) {
        guardarExito({
          mensaje: resultado.error ?? mensajeErrorFallback,
        });
        return;
      }

      limpiarBorrador();
      guardarExito({
        mensaje: mensajeExitoFallback(resultado),
        numeroReporte: resultado.numeroReporte,
        slug: resultado.slug,
      });

      emitirReportePublicado();
      router.refresh();
    })();
  }, [
    status,
    flagContexto,
    setFlagContexto,
    hayPendiente,
    leerBorrador,
    limpiarBorrador,
    publicar,
    guardarExito,
    mensajeErrorFallback,
    mensajeExitoFallback,
    modal,
    tipo,
    setPublicandoReporte,
    cerrarModal,
    abrirModal,
    router,
  ]);
}

/** Tras iniciar sesión, publica borradores de avistamiento o pérdida guardados en el cliente. */
export function ProcesadorPublicacionPendiente() {
  const {
    avistamientoPendienteAuth,
    setAvistamientoPendienteAuth,
    perdidaPendienteAuth,
    setPerdidaPendienteAuth,
  } = useModales();

  usePublicacionPendienteAuth({
    tipo: "avistamiento",
    modal: "sighting",
    flagContexto: avistamientoPendienteAuth,
    setFlagContexto: setAvistamientoPendienteAuth,
    hayPendiente: hayAvistamientoPendienteAuth,
    leerBorrador: leerBorradorAvistamiento,
    limpiarBorrador: limpiarBorradorAvistamiento,
    publicar: async (borrador) => crearAvistamiento(borrador.datos),
    guardarExito: guardarExitoAvistamiento,
    mensajeErrorFallback:
      "No se pudo publicar el avistamiento. Revisa el formulario e inténtalo de nuevo.",
    mensajeExitoFallback: (resultado) =>
      resultado.mensaje ??
      `Avistamiento #${resultado.numeroReporte} publicado correctamente.`,
  });

  usePublicacionPendienteAuth({
    tipo: "perdida",
    modal: "report",
    flagContexto: perdidaPendienteAuth,
    setFlagContexto: setPerdidaPendienteAuth,
    hayPendiente: hayPerdidaPendienteAuth,
    leerBorrador: leerBorradorPerdida,
    limpiarBorrador: limpiarBorradorPerdida,
    publicar: publicarReportePerdida,
    guardarExito: guardarExitoPerdida,
    mensajeErrorFallback: "No se pudo publicar el reporte. Inténtalo de nuevo.",
    mensajeExitoFallback: (resultado) =>
      resultado.mensaje ?? "Reporte publicado correctamente.",
  });

  return null;
}
