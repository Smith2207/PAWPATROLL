"use client";

import {
  BotonCerrarModal,
  ModalContenedor,
} from "@/componentes/landing/modales/ModalContenedor";
import { Icono } from "@/componentes/ui/Icono";
import { IdentificacionPorFoto } from "@/componentes/visual/IdentificacionPorFoto";

export function ModalBusquedaPorFoto() {
  return (
    <ModalContenedor tipo="busquedaFoto" anchoMaximo={560}>
      <div className="modal-header">
        <div className="modal-header-accent modal-header-accent--blue" />
        <BotonCerrarModal tipo="busquedaFoto" />
        <div className="modal-title">
          <Icono nombre="camara" size={20} className="pp-icon--btn" /> Buscar por foto
        </div>
        <div className="modal-sub">
          ¿Viste un perro o gato perdido? Sube una foto y te mostramos mascotas
          parecidas.
        </div>
      </div>
      <div className="modal-body">
        <IdentificacionPorFoto />
      </div>
    </ModalContenedor>
  );
}
