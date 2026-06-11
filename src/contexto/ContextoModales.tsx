"use client";



/**
 * Contexto React global: contexto modales.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

export type TipoModal =
  | "report"
  | "sighting"
  | "login"
  | "registro"
  | "busquedaFoto";

export type TipoPublicandoReporte = "avistamiento" | "perdida";

/** Mascota desde la ficha pública al reportar avistamiento */
export type MascotaAvistamientoFijada = {
  id: string;
  nombre: string;
  tipo?: string;
  color?: string | null;
  raza?: string | null;
};

type ContextoModalesValor = {
  modalAbierto: TipoModal | null;
  mascotaAvistamiento: MascotaAvistamientoFijada | null;
  /** Hay un avistamiento en borrador esperando login para publicarse */
  avistamientoPendienteAuth: boolean;
  setAvistamientoPendienteAuth: (activo: boolean) => void;
  /** Hay un reporte de pérdida en borrador esperando login */
  perdidaPendienteAuth: boolean;
  setPerdidaPendienteAuth: (activo: boolean) => void;
  publicandoReporte: TipoPublicandoReporte | null;
  setPublicandoReporte: (tipo: TipoPublicandoReporte | null) => void;
  abrirModal: (tipo: TipoModal) => void;
  abrirBusquedaPorFoto: () => void;
  abrirAvistamiento: (mascota?: MascotaAvistamientoFijada) => void;
  cerrarModal: (tipo: TipoModal) => void;
  cerrarTodos: () => void;
};

const ContextoModales = createContext<ContextoModalesValor | null>(null);

export function ProveedorModales({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <ProveedorModalesEstado key={pathname}>{children}</ProveedorModalesEstado>
  );
}

function ProveedorModalesEstado({ children }: { children: ReactNode }) {
  const [modalAbierto, setModalAbierto] = useState<TipoModal | null>(null);
  const [mascotaAvistamiento, setMascotaAvistamiento] =
    useState<MascotaAvistamientoFijada | null>(null);
  const [avistamientoPendienteAuth, setAvistamientoPendienteAuth] =
    useState(false);
  const [perdidaPendienteAuth, setPerdidaPendienteAuth] = useState(false);
  const [publicandoReporte, setPublicandoReporte] =
    useState<TipoPublicandoReporte | null>(null);

  const abrirModal = useCallback((tipo: TipoModal) => {
    if (tipo !== "sighting") setMascotaAvistamiento(null);
    setModalAbierto(tipo);
    document.body.style.overflow = "hidden";
  }, []);

  const abrirBusquedaPorFoto = useCallback(() => {
    setMascotaAvistamiento(null);
    setModalAbierto("busquedaFoto");
    document.body.style.overflow = "hidden";
  }, []);

  const abrirAvistamiento = useCallback((mascota?: MascotaAvistamientoFijada) => {
    setMascotaAvistamiento(mascota ?? null);
    setModalAbierto("sighting");
    document.body.style.overflow = "hidden";
  }, []);

  const cerrarModal = useCallback((tipo: TipoModal) => {
    setModalAbierto((actual) => (actual === tipo ? null : actual));
    if (tipo === "sighting") setMascotaAvistamiento(null);
    document.body.style.overflow = "";
  }, []);

  const cerrarTodos = useCallback(() => {
    setModalAbierto(null);
    setMascotaAvistamiento(null);
    document.body.style.overflow = "";
  }, []);

  useEffect(() => {
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrarTodos();
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [cerrarTodos]);

  const valor = useMemo(
    () => ({
      modalAbierto,
      mascotaAvistamiento,
      avistamientoPendienteAuth,
      setAvistamientoPendienteAuth,
      perdidaPendienteAuth,
      setPerdidaPendienteAuth,
      publicandoReporte,
      setPublicandoReporte,
      abrirModal,
      abrirBusquedaPorFoto,
      abrirAvistamiento,
      cerrarModal,
      cerrarTodos,
    }),
    [
      modalAbierto,
      mascotaAvistamiento,
      avistamientoPendienteAuth,
      perdidaPendienteAuth,
      publicandoReporte,
      abrirModal,
      abrirBusquedaPorFoto,
      abrirAvistamiento,
      cerrarModal,
      cerrarTodos,
    ]
  );

  return (
    <ContextoModales.Provider value={valor}>{children}</ContextoModales.Provider>
  );
}

export function useModales() {
  const ctx = useContext(ContextoModales);
  if (!ctx) {
    throw new Error("useModales debe usarse dentro de ProveedorModales");
  }
  return ctx;
}
