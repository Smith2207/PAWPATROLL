"use client";



/**
 * [landing] Modal: iniciar sesion.
 */
/**
 * [landing] Modal: iniciar sesion.
 */
import { FormularioInicioSesion } from "@/componentes/auth/FormularioInicioSesion";
import {
  BotonCerrarModal,
  ModalContenedor,
} from "@/componentes/landing/modales/ModalContenedor";
import { useEstadoPublicacionPendiente } from "@/hooks/useEstadoPublicacionPendiente";

export function ModalIniciarSesion() {
  const { tituloLogin, subtituloLogin } = useEstadoPublicacionPendiente();

  return (
    <ModalContenedor tipo="login">
      <div className="modal-header">
        <div className="modal-header-accent" />
        <BotonCerrarModal tipo="login" />
        <div className="modal-title">{tituloLogin}</div>
        <div className="modal-sub">{subtituloLogin}</div>
      </div>
      <div className="modal-body">
        <FormularioInicioSesion enModal />
      </div>
    </ModalContenedor>
  );
}
