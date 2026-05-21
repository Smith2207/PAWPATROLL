"use client";

import { FormularioInicioSesion } from "@/componentes/auth/FormularioInicioSesion";
import {
  BotonCerrarModal,
  ModalContenedor,
} from "@/componentes/landing/modales/ModalContenedor";

export function ModalIniciarSesion() {
  return (
    <ModalContenedor tipo="login">
      <div className="modal-header">
        <div className="modal-header-accent" />
        <BotonCerrarModal tipo="login" />
        <div className="modal-title">👋 Bienvenido a PawPatrol</div>
        <div className="modal-sub">
          Inicia sesión para ayudar a encontrar mascotas perdidas
        </div>
      </div>
      <div className="modal-body">
        <FormularioInicioSesion enModal />
      </div>
    </ModalContenedor>
  );
}
