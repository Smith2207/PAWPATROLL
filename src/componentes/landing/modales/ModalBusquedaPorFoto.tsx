"use client";



/**
 * [landing] Modal: busqueda por foto.
 */
import { ModalContenedor } from "@/componentes/landing/modales/ModalContenedor";
import { EncabezadoModalReporte } from "@/componentes/landing/modales/ui/EncabezadoModalReporte";
import { Icono } from "@/componentes/ui/Icono";
import { IdentificacionPorFoto } from "@/componentes/visual/IdentificacionPorFoto";

export function ModalBusquedaPorFoto() {
  return (
    <ModalContenedor tipo="busquedaFoto" anchoMaximo={560}>
      <EncabezadoModalReporte
        tipo="busquedaFoto"
        accent="blue"
        titulo={
          <>
            <Icono nombre="camara" size={20} className="pp-icon--btn" /> Buscar por foto
          </>
        }
        subtitulo="¿Viste un perro o gato perdido? Sube una foto y te mostramos mascotas parecidas."
      />
      <div className="modal-body">
        <IdentificacionPorFoto />
      </div>
    </ModalContenedor>
  );
}
