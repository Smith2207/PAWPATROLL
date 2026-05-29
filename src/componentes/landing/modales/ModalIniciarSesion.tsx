"use client";

import { FormularioInicioSesion } from "@/componentes/auth/FormularioInicioSesion";
import {
  BotonCerrarModal,
  ModalContenedor,
} from "@/componentes/landing/modales/ModalContenedor";
import { useModales } from "@/contexto/ContextoModales";
import { hayAvistamientoPendienteAuth } from "@/lib/avistamientos/borrador-cliente";
import { hayPerdidaPendienteAuth } from "@/lib/perdidas/borrador-cliente";

export function ModalIniciarSesion() {
  const { avistamientoPendienteAuth, perdidaPendienteAuth } = useModales();
  const pendienteAvistamiento =
    avistamientoPendienteAuth || hayAvistamientoPendienteAuth();
  const pendientePerdida =
    perdidaPendienteAuth || hayPerdidaPendienteAuth();

  let titulo = "👋 Bienvenido a PawPatrol";
  let subtitulo =
    "Inicia sesión para ayudar a encontrar mascotas perdidas";

  if (pendientePerdida) {
    titulo = "Último paso: tu cuenta";
    subtitulo =
      "Tu alerta de búsqueda está lista. Inicia sesión o regístrate para activarla de forma segura.";
  } else if (pendienteAvistamiento) {
    titulo = "Último paso: tu cuenta";
    subtitulo =
      "Tu avistamiento está listo. Inicia sesión o regístrate para publicarlo de forma segura.";
  }

  return (
    <ModalContenedor tipo="login">
      <div className="modal-header">
        <div className="modal-header-accent" />
        <BotonCerrarModal tipo="login" />
        <div className="modal-title">{titulo}</div>
        <div className="modal-sub">{subtitulo}</div>
      </div>
      <div className="modal-body">
        <FormularioInicioSesion enModal />
      </div>
    </ModalContenedor>
  );
}
