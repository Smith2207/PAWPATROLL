"use client";



/**
 * [landing] Modal: registro.
 */
import { Icono } from "@/componentes/ui/Icono";
import { FormularioRegistro } from "@/componentes/auth/FormularioRegistro";
import {
  BotonCerrarModal,
  ModalContenedor,
} from "@/componentes/landing/modales/ModalContenedor";
import { useEstadoPublicacionPendiente } from "@/hooks/useEstadoPublicacionPendiente";

export function ModalRegistro() {
  const { subtituloRegistro } = useEstadoPublicacionPendiente();

  return (
    <ModalContenedor tipo="registro" anchoMaximo={520}>
      <div className="modal-header">
        <div className="modal-header-accent" />
        <BotonCerrarModal tipo="registro" />
        <div className="modal-title">
          <Icono nombre="huella" size={20} className="pp-icon--btn" /> Crear cuenta
        </div>
        <div className="modal-sub">{subtituloRegistro}</div>
      </div>
      <div className="modal-body">
        <FormularioRegistro enModal />
      </div>
    </ModalContenedor>
  );
}
