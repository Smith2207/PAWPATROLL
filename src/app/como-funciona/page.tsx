/**
 * Ruta /como-funciona. Página principal de la ruta.
 */
import { ContenedorPublico } from "@/componentes/landing/ContenedorPublico";
import { EncabezadoPagina } from "@/componentes/landing/EncabezadoPagina";
import { SeccionCaracteristicas } from "@/componentes/landing/SeccionCaracteristicas";
import { SeccionPasosReunion } from "@/componentes/landing/SeccionPasosReunion";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cómo funciona — PawPatrol",
  description:
    "Pasos para reportar una pérdida, registrar avistamientos y usar el mapa comunitario.",
};

export default function PaginaComoFunciona() {
  return (
    <ContenedorPublico>
      <EncabezadoPagina
        eyebrow="Guía"
        titulo="Cómo funciona PawPatrol"
        descripcion="Reporta, busca en el mapa y colabora con la comunidad para reunir mascotas con su familia."
      />
      <SeccionCaracteristicas sinEncabezado />
      <SeccionPasosReunion sinEncabezado />
    </ContenedorPublico>
  );
}
