"use client";

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

export type TipoModal = "report" | "sighting" | "login" | "registro" | "quickcam";

type ContextoModalesValor = {
  modalAbierto: TipoModal | null;
  abrirModal: (tipo: TipoModal) => void;
  cerrarModal: (tipo: TipoModal) => void;
  cerrarTodos: () => void;
};

const ContextoModales = createContext<ContextoModalesValor | null>(null);

export function ProveedorModales({ children }: { children: ReactNode }) {
  const [modalAbierto, setModalAbierto] = useState<TipoModal | null>(null);
  const pathname = usePathname();

  const abrirModal = useCallback((tipo: TipoModal) => {
    setModalAbierto(tipo);
    document.body.style.overflow = "hidden";
  }, []);

  const cerrarModal = useCallback((tipo: TipoModal) => {
    setModalAbierto((actual) => (actual === tipo ? null : actual));
    document.body.style.overflow = "";
  }, []);

  const cerrarTodos = useCallback(() => {
    setModalAbierto(null);
    document.body.style.overflow = "";
  }, []);

  useEffect(() => {
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrarTodos();
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [cerrarTodos]);

  useEffect(() => {
    setModalAbierto(null);
    document.body.style.overflow = "";
  }, [pathname]);

  const valor = useMemo(
    () => ({ modalAbierto, abrirModal, cerrarModal, cerrarTodos }),
    [modalAbierto, abrirModal, cerrarModal, cerrarTodos]
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
