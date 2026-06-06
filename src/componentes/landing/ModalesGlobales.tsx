"use client";

import { useEffect, useState } from "react";
import { listarMascotasPerdidasParaSelector } from "@/actions/avistamientos";
import { ModalReportarPerdida } from "@/componentes/landing/modales/ModalReportarPerdida";
import { ModalReportarAvistamiento } from "@/componentes/landing/modales/ModalReportarAvistamiento";
import { ModalIniciarSesion } from "@/componentes/landing/modales/ModalIniciarSesion";
import { ModalRegistro } from "@/componentes/landing/modales/ModalRegistro";
import { ModalBusquedaPorFoto } from "@/componentes/landing/modales/ModalBusquedaPorFoto";
import { ProcesadorAvistamientoPendiente } from "@/componentes/avistamientos/ProcesadorAvistamientoPendiente";
import { ProcesadorPerdidaPendiente } from "@/componentes/perdidas/ProcesadorPerdidaPendiente";

/** Modales disponibles en toda la app (landing, ficha pública, perfil, etc.) */
export function ModalesGlobales() {
  const [mascotasPerdidas, setMascotasPerdidas] = useState<
    { id: string; nombre: string; slug: string }[]
  >([]);

  useEffect(() => {
    listarMascotasPerdidasParaSelector()
      .then(setMascotasPerdidas)
      .catch(() => setMascotasPerdidas([]));
  }, []);

  return (
    <>
      <ProcesadorAvistamientoPendiente />
      <ProcesadorPerdidaPendiente />
      <ModalReportarPerdida />
      <ModalReportarAvistamiento mascotasPerdidas={mascotasPerdidas} />
      <ModalIniciarSesion />
      <ModalRegistro />
      <ModalBusquedaPorFoto />
    </>
  );
}
