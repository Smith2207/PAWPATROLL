"use client";

import { FormularioRegistro } from "@/componentes/auth/FormularioRegistro";
import {
  BotonCerrarModal,
  ModalContenedor,
} from "@/componentes/landing/modales/ModalContenedor";

export function ModalRegistro() {
  return (
    <ModalContenedor tipo="registro" anchoMaximo={520}>
      <div className="modal-header">
        <div className="modal-header-accent" />
        <BotonCerrarModal tipo="registro" />
        <div className="modal-title">🐾 Crear cuenta</div>
        <div className="modal-sub">
          Únete a PawPatrol y protege a tus mascotas con su ficha digital
        </div>
      </div>
      <div className="modal-body">
        <FormularioRegistro enModal />
      </div>
    </ModalContenedor>
  );
}
