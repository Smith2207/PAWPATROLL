"use client";

import {
  BotonCerrarModal,
  ModalContenedor,
} from "@/componentes/landing/modales/ModalContenedor";
import { FormularioDatosMascota } from "@/componentes/landing/modales/FormularioDatosMascota";
import { FormularioFotosMascota } from "@/componentes/landing/modales/FormularioFotosMascota";
import { SelectorUbicacionMapa } from "@/componentes/landing/ui/SelectorUbicacionMapa";

export function ModalReportarPerdida() {
  return (
    <ModalContenedor tipo="report">
      <div className="modal-header">
        <div className="modal-header-accent" />
        <BotonCerrarModal tipo="report" />
        <div className="modal-title">🚨 Reportar mascota perdida</div>
        <div className="modal-sub">
          Completa la información para activar la alerta en tu zona
        </div>
      </div>
      <div className="modal-body">
        <FormularioDatosMascota />

        <div className="section-divider">📍 Ubicación donde se perdió</div>

        <SelectorUbicacionMapa
          etiqueta="Dirección o zona de pérdida *"
          idInput="report-location"
          icono="📍"
          placeholder="Ej: Jr. Moquegua 345, Puno"
          pinMapa="📍"
          textoMapa="🗺️ Haz clic para seleccionar en el mapa"
        />

        <div className="form-group">
          <label>Referencias adicionales de la zona</label>
          <input
            type="text"
            placeholder="Ej: Cerca al mercado, frente al parque..."
          />
        </div>

        <FormularioFotosMascota />

        <div className="section-divider">Datos de contacto</div>

        <div className="form-row">
          <div className="form-group">
            <label>Tu nombre *</label>
            <input type="text" placeholder="Nombre del dueño" />
          </div>
          <div className="form-group">
            <label>Teléfono (privado)</label>
            <input type="tel" placeholder="+51 999 999 999" />
          </div>
        </div>
        <div className="form-group">
          <label>Correo electrónico *</label>
          <input type="email" placeholder="tucorreo@ejemplo.com" />
        </div>
        <div className="form-group">
          <label>¿Ofrece recompensa?</label>
          <input
            type="text"
            placeholder="Ej: S/. 200 a quien lo encuentre (opcional)"
          />
        </div>

        <button type="button" className="submit-btn">
          🚨 Activar alerta de búsqueda
        </button>
      </div>
    </ModalContenedor>
  );
}
