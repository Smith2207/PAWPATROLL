"use client";



/**
 * Hook React: wizard reporte.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useModales, type TipoModal, type TipoPublicandoReporte } from "@/contexto/ContextoModales";
import { EVENTO_REPORTE_PUBLICADO } from "@/lib/eventos-cliente";
import { RUTAS_LANDING } from "@/lib/landing/rutas";

export type { PasoWizard } from "@/lib/reportes/pasos-wizard";

type ResultadoExito = {
  mensaje: string;
  numeroReporte?: number;
  slug?: string;
};

type OpcionesWizardReporte = {
  modalId: TipoModal;
  pasoFinal: number;
  tipoPublicando: TipoPublicandoReporte;
  leerYQuitarExito: () => ResultadoExito | null;
  /** Devuelve true si el resultado del procesador post-login es éxito (no error). */
  esExitoPublicacion: (resultado: ResultadoExito) => boolean;
  /** Tras login automático: restaurar borrador; devuelve true si había borrador. */
  restaurarBorrador?: () => boolean;
  /** Si true, no restaurar borrador al abrir (p. ej. avistamiento desde ficha). */
  omitirRestaurarBorrador?: () => boolean;
  /** Lógica extra al abrir el modal (reset campos específicos). */
  alResetearModal?: () => void;
};

/**
 * Estado y flujo común de modales de reporte (wizard, borrador, login, éxito).
 * Usado por ModalReportarPerdida y ModalReportarAvistamiento.
 */
export function useWizardReporte({
  modalId,
  pasoFinal,
  tipoPublicando,
  leerYQuitarExito,
  esExitoPublicacion,
  restaurarBorrador,
  omitirRestaurarBorrador,
  alResetearModal,
}: OpcionesWizardReporte) {
  const router = useRouter();
  const {
    abrirModal,
    cerrarModal,
    modalAbierto,
    publicandoReporte,
    setAvistamientoPendienteAuth,
    setPerdidaPendienteAuth,
  } = useModales();

  const [paso, setPaso] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [metaExito, setMetaExito] = useState<{
    slug?: string;
    numeroReporte?: number;
  } | null>(null);
  const [avisoBorrador, setAvisoBorrador] = useState(false);
  const [cargando, setCargando] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const publicando = publicandoReporte === tipoPublicando || cargando;

  const limpiarMensajes = useCallback(() => {
    setError(null);
    setExito(null);
    setMetaExito(null);
  }, []);

  const aplicarResultadoPublicacion = useCallback(() => {
    const resultado = leerYQuitarExito();
    if (!resultado) return false;

    if (esExitoPublicacion(resultado)) {
      setExito(resultado.mensaje);
      setMetaExito({
        slug: resultado.slug,
        numeroReporte: resultado.numeroReporte,
      });
      setError(null);
      setAvisoBorrador(false);
    } else {
      setExito(null);
      setMetaExito(null);
      setError(resultado.mensaje);
    }
    return true;
  }, [leerYQuitarExito, esExitoPublicacion]);

  useEffect(() => {
    const onPublicado = () => aplicarResultadoPublicacion();
    window.addEventListener(EVENTO_REPORTE_PUBLICADO, onPublicado);
    return () =>
      window.removeEventListener(EVENTO_REPORTE_PUBLICADO, onPublicado);
  }, [aplicarResultadoPublicacion]);

  useEffect(() => {
    queueMicrotask(() => {
      if (modalAbierto !== modalId) {
        setPaso(1);
        return;
      }

      if (aplicarResultadoPublicacion()) return;

      if (omitirRestaurarBorrador?.()) return;

      const teniaBorrador = restaurarBorrador?.() ?? false;
      if (teniaBorrador) {
        setAvisoBorrador(true);
        setPaso(1);
        setError(null);
        setExito(null);
      } else {
        alResetearModal?.();
      }
    });
  }, [
    modalAbierto,
    modalId,
    aplicarResultadoPublicacion,
    restaurarBorrador,
    omitirRestaurarBorrador,
    alResetearModal,
  ]);

  const irAtras = useCallback(() => {
    setError(null);
    setPaso((p) => Math.max(1, p - 1));
  }, []);

  const irSiguiente = useCallback(
    (validar?: () => string | null) => {
      if (validar) {
        const err = validar();
        if (err) {
          setError(err);
          return false;
        }
      }
      setError(null);
      setPaso((p) => Math.min(pasoFinal, p + 1));
      return true;
    },
    [pasoFinal]
  );

  const verMapaYCerrar = useCallback(() => {
    cerrarModal(modalId);
    router.push(`${RUTAS_LANDING.comunidad}#mapa`);
  }, [cerrarModal, modalId, router]);

  const solicitarLoginParaPublicar = useCallback(
    (opts: {
      guardarBorrador: () => boolean;
      marcarPendienteStorage: () => void;
      setFlagContexto: (valor: boolean) => void;
      mensajeErrorGuardado: string;
    }) => {
      const guardado = opts.guardarBorrador();
      if (!guardado) {
        setError(opts.mensajeErrorGuardado);
        return;
      }
      opts.marcarPendienteStorage();
      opts.setFlagContexto(true);
      abrirModal("login");
    },
    [abrirModal]
  );

  return {
    paso,
    setPaso,
    pasoFinal,
    error,
    setError,
    exito,
    setExito,
    metaExito,
    setMetaExito,
    avisoBorrador,
    setAvisoBorrador,
    limpiarMensajes,
    cargando,
    setCargando,
    publicando,
    formRef,
    irAtras,
    irSiguiente,
    verMapaYCerrar,
    cerrarModal: () => cerrarModal(modalId),
    solicitarLoginParaPublicar,
    setAvistamientoPendienteAuth,
    setPerdidaPendienteAuth,
  };
}
