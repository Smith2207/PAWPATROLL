"use client";

import { useEffect } from "react";
import { ProveedorModales } from "@/contexto/ContextoModales";
import { irASeccion } from "@/hooks/useNavegacionSecciones";
import { BarraNavegacion } from "@/componentes/landing/BarraNavegacion";
import { SeccionHero } from "@/componentes/landing/SeccionHero";
import { BarraBusqueda } from "@/componentes/landing/BarraBusqueda";
import { SeccionCaracteristicas } from "@/componentes/landing/SeccionCaracteristicas";
import { SeccionPasosReunion } from "@/componentes/landing/SeccionPasosReunion";
import { BannerModuloComportamiento } from "@/componentes/landing/BannerModuloComportamiento";
import { SeccionMascotasRecientes } from "@/componentes/landing/SeccionMascotasRecientes";
import { SeccionLlamadaAccion } from "@/componentes/landing/SeccionLlamadaAccion";
import { PiePagina } from "@/componentes/landing/PiePagina";
import { ModalReportarPerdida } from "@/componentes/landing/modales/ModalReportarPerdida";
import { ModalReportarAvistamiento } from "@/componentes/landing/modales/ModalReportarAvistamiento";
import { ModalIniciarSesion } from "@/componentes/landing/modales/ModalIniciarSesion";
import { ModalIdentificacionPorFoto } from "@/componentes/landing/modales/ModalIdentificacionPorFoto";

export default function PaginaLanding() {
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash) {
      requestAnimationFrame(() => irASeccion(hash));
    }
  }, []);

  return (
    <ProveedorModales>
      <BarraNavegacion />
      <SeccionHero />
      <BarraBusqueda />
      <SeccionCaracteristicas />
      <SeccionPasosReunion />
      <BannerModuloComportamiento />
      <SeccionMascotasRecientes />
      <SeccionLlamadaAccion />
      <PiePagina />

      <ModalReportarPerdida />
      <ModalReportarAvistamiento />
      <ModalIniciarSesion />
      <ModalIdentificacionPorFoto />
    </ProveedorModales>
  );
}
