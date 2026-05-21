"use client";

import { useEffect } from "react";
import { irASeccion } from "@/hooks/useNavegacionSecciones";
import { BarraNavegacion } from "@/componentes/landing/BarraNavegacion";
import { SeccionHero } from "@/componentes/landing/SeccionHero";
import { BarraBusqueda } from "@/componentes/landing/BarraBusqueda";
import { SeccionCaracteristicas } from "@/componentes/landing/SeccionCaracteristicas";
import { SeccionPasosReunion } from "@/componentes/landing/SeccionPasosReunion";
import { BannerModuloComportamiento } from "@/componentes/landing/BannerModuloComportamiento";
import {
  SeccionMascotasRecientes,
  type MascotaPublicaTarjeta,
} from "@/componentes/landing/SeccionMascotasRecientes";
import { SeccionLlamadaAccion } from "@/componentes/landing/SeccionLlamadaAccion";
import { PiePagina } from "@/componentes/landing/PiePagina";
import { ModalReportarPerdida } from "@/componentes/landing/modales/ModalReportarPerdida";
import { ModalReportarAvistamiento } from "@/componentes/landing/modales/ModalReportarAvistamiento";
import { ModalIniciarSesion } from "@/componentes/landing/modales/ModalIniciarSesion";
import { ModalIdentificacionPorFoto } from "@/componentes/landing/modales/ModalIdentificacionPorFoto";
import { AbrirLoginDesdeUrl } from "@/componentes/auth/AbrirLoginDesdeUrl";
import { Suspense } from "react";

type Props = {
  mascotasActivas?: MascotaPublicaTarjeta[];
};

export default function PaginaLanding({ mascotasActivas = [] }: Props) {
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash) {
      requestAnimationFrame(() => irASeccion(hash));
    }
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <AbrirLoginDesdeUrl />
      </Suspense>
      <BarraNavegacion />
      <SeccionHero />
      <BarraBusqueda />
      <SeccionCaracteristicas />
      <SeccionPasosReunion />
      <BannerModuloComportamiento />
      <SeccionMascotasRecientes mascotas={mascotasActivas} />
      <SeccionLlamadaAccion />
      <PiePagina />

      <ModalReportarPerdida />
      <ModalReportarAvistamiento />
      <ModalIniciarSesion />
      <ModalIdentificacionPorFoto />
    </>
  );
}
