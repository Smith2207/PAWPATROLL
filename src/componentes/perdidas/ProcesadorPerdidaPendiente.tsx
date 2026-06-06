"use client";

import { useModales } from "@/contexto/ContextoModales";
import {
  guardarExitoPerdida,
  hayPerdidaPendienteAuth,
  leerBorradorPerdida,
  limpiarBorradorPerdida,
} from "@/lib/perdidas/borrador-cliente";
import { publicarReportePerdida } from "@/lib/perdidas/publicar-reporte";
import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/** Tras iniciar sesión, publica el borrador de «Perdí a mi mascota». */
export function ProcesadorPerdidaPendiente() {
  const { status } = useSession();
  const router = useRouter();
  const {
    perdidaPendienteAuth,
    setPerdidaPendienteAuth,
    setPublicandoReporte,
    cerrarModal,
    abrirModal,
  } = useModales();
  const procesando = useRef(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!perdidaPendienteAuth && !hayPerdidaPendienteAuth()) return;
    if (procesando.current) return;

    const borrador = leerBorradorPerdida();
    if (!borrador) {
      setPerdidaPendienteAuth(false);
      return;
    }

    procesando.current = true;
    cerrarModal("login");
    cerrarModal("registro");
    abrirModal("report");
    setPublicandoReporte("perdida");

    void (async () => {
      const resultado = await publicarReportePerdida(borrador);

      procesando.current = false;
      setPublicandoReporte(null);
      setPerdidaPendienteAuth(false);

      if (!resultado.ok) {
        guardarExitoPerdida({ mensaje: resultado.error });
        window.dispatchEvent(new CustomEvent("pawpatroll:reporte-publicado"));
        return;
      }

      limpiarBorradorPerdida();

      guardarExitoPerdida({
        mensaje: resultado.mensaje,
        slug: resultado.slug,
      });

      window.dispatchEvent(new CustomEvent("pawpatroll:reporte-publicado"));
      router.refresh();
    })();
  }, [
    status,
    perdidaPendienteAuth,
    setPerdidaPendienteAuth,
    setPublicandoReporte,
    cerrarModal,
    abrirModal,
    router,
  ]);

  return null;
}
