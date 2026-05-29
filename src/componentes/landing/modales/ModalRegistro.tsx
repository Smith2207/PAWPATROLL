"use client";

import { FormularioRegistro } from "@/componentes/auth/FormularioRegistro";
import {
  BotonCerrarModal,
  ModalContenedor,
} from "@/componentes/landing/modales/ModalContenedor";
import { useModales } from "@/contexto/ContextoModales";
import { hayAvistamientoPendienteAuth } from "@/lib/avistamientos/borrador-cliente";
import { hayPerdidaPendienteAuth } from "@/lib/perdidas/borrador-cliente";

export function ModalRegistro() {
  const { avistamientoPendienteAuth, perdidaPendienteAuth } = useModales();
  const pendienteAvistamiento =
    avistamientoPendienteAuth || hayAvistamientoPendienteAuth();
  const pendientePerdida =
    perdidaPendienteAuth || hayPerdidaPendienteAuth();

  let subtitulo =
    "Únete a PawPatroll y protege a tus mascotas con su ficha digital";

  if (pendientePerdida) {
    subtitulo =
      "Crea tu cuenta para activar la alerta que ya completaste. Luego verifica tu correo e inicia sesión.";
  } else if (pendienteAvistamiento) {
    subtitulo =
      "Crea tu cuenta para publicar el avistamiento que ya completaste. Luego verifica tu correo e inicia sesión.";
  }

  return (
    <ModalContenedor tipo="registro" anchoMaximo={520}>
      <div className="modal-header">
        <div className="modal-header-accent" />
        <BotonCerrarModal tipo="registro" />
        <div className="modal-title">🐾 Crear cuenta</div>
        <div className="modal-sub">{subtitulo}</div>
      </div>
      <div className="modal-body">
        <FormularioRegistro enModal />
      </div>
    </ModalContenedor>
  );
}
