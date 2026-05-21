"use client";

import { ModalReportarPerdida } from "@/componentes/landing/modales/ModalReportarPerdida";
import { ModalReportarAvistamiento } from "@/componentes/landing/modales/ModalReportarAvistamiento";
import { ModalIniciarSesion } from "@/componentes/landing/modales/ModalIniciarSesion";
import { ModalIdentificacionPorFoto } from "@/componentes/landing/modales/ModalIdentificacionPorFoto";

/** Modales disponibles en toda la app (landing, ficha pública, perfil, etc.) */
export function ModalesGlobales() {
  return (
    <>
      <ModalReportarPerdida />
      <ModalReportarAvistamiento />
      <ModalIniciarSesion />
      <ModalIdentificacionPorFoto />
    </>
  );
}
