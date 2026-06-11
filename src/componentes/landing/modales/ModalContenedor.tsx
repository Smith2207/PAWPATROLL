"use client";



/**
 * [landing] Modal: contenedor.
 */
import { useModales, type TipoModal } from "@/contexto/ContextoModales";
import { Icono } from "@/componentes/ui/Icono";
import type { ReactNode } from "react";

type Props = {
  tipo: TipoModal;
  children: ReactNode;
  anchoMaximo?: number;
  alCerrar?: () => void;
};

export function ModalContenedor({
  tipo,
  children,
  anchoMaximo = 520,
  alCerrar,
}: Props) {
  const { modalAbierto, cerrarTodos } = useModales();
  const abierto = modalAbierto === tipo;

  if (!abierto) return null;

  return (
    <div
      className={`modal-overlay${abierto ? " open" : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          alCerrar?.();
          cerrarTodos();
        }
      }}
    >
      <div className="modal" style={{ maxWidth: anchoMaximo }}>
        {children}
      </div>
    </div>
  );
}

export function BotonCerrarModal({
  tipo,
  alCerrar,
}: {
  tipo: TipoModal;
  alCerrar?: () => void;
}) {
  const { cerrarModal } = useModales();
  return (
    <button
      type="button"
      className="modal-close"
      onClick={() => {
        alCerrar?.();
        cerrarModal(tipo);
      }}
    >
      <Icono nombre="cerrar" size={16} />
    </button>
  );
}
