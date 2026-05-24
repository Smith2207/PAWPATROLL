"use client";

import {
  BotonCerrarModal,
  ModalContenedor,
} from "@/componentes/landing/modales/ModalContenedor";
import { SelectorUbicacionMapa } from "@/componentes/landing/ui/SelectorUbicacionMapa";
import { OPCIONES_TIPO_CON_EMOJI } from "@/lib/mascotas/tipos";

export function ModalReportarAvistamiento() {
  return (
    <ModalContenedor tipo="sighting">
      <div className="modal-header">
        <div className="modal-header-accent modal-header-accent--mint" />
        <BotonCerrarModal tipo="sighting" />
        <div className="modal-title">👁️ Reportar avistamiento</div>
        <div className="modal-sub">
          ¿Viste una mascota perdida? ¡Ayuda a reunirla con su familia!
        </div>
      </div>
      <div className="modal-body">
        <div className="section-divider">¿Qué viste?</div>

        <div className="form-row">
          <div className="form-group">
            <label>¿Perro o gato? *</label>
            <select defaultValue="">
              <option value="">Seleccionar...</option>
              {OPCIONES_TIPO_CON_EMOJI.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Tamaño aproximado</label>
            <select defaultValue="">
              <option value="">Seleccionar...</option>
              <option>Pequeño</option>
              <option>Mediano</option>
              <option>Grande</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Color principal</label>
            <input type="text" placeholder="Ej: negro con blanco" />
          </div>
          <div className="form-group">
            <label>Raza (si la identificas)</label>
            <input type="text" placeholder="Ej: Labrador" />
          </div>
        </div>

        <div className="form-group">
          <label>Fecha y hora del avistamiento *</label>
          <input type="datetime-local" />
        </div>

        <div className="section-divider">📍 Ubicación donde la viste</div>

        <SelectorUbicacionMapa
          etiqueta="Dirección o zona donde la avistaste *"
          idInput="sighting-location"
          icono="👁️"
          placeholder="Ej: Parque Pino, Av. Floral, Puno"
          pinMapa="🐾"
          textoMapa="🗺️ Haz clic para marcar en el mapa"
        />

        <div className="form-group">
          <label>Referencias del lugar</label>
          <input
            type="text"
            placeholder="Ej: Esquina con Jr. Lima, frente a la farmacia..."
          />
        </div>

        <div className="form-group">
          <label>¿En qué dirección se movía?</label>
          <select defaultValue="">
            <option value="">No lo noté</option>
            <option>Hacia el norte / parque</option>
            <option>Hacia el sur / lago</option>
            <option>Hacia el este / mercado</option>
            <option>Hacia el oeste / terminal</option>
            <option>Se quedó en el lugar</option>
          </select>
        </div>

        <div className="form-group">
          <label>Descripción del avistamiento</label>
          <textarea
            rows={3}
            placeholder="¿Llevaba collar? ¿Era amistoso o asustado? ¿Había alguien cerca? Cualquier detalle ayuda..."
          />
        </div>

        <div className="section-divider">Foto del avistamiento</div>

        <div className="photo-upload">
          <div className="photo-upload-icon">📷</div>
          <div className="photo-upload-text">
            Sube una foto del avistamiento (muy recomendado)
            <br />
            <span className="photo-upload-cta">
              La IA buscará coincidencias automáticamente
            </span>
          </div>
        </div>

        <div className="section-divider">Tu contacto (opcional)</div>

        <div className="form-row">
          <div className="form-group">
            <label>Nombre</label>
            <input type="text" placeholder="Tu nombre" />
          </div>
          <div className="form-group">
            <label>Teléfono</label>
            <input type="tel" placeholder="+51 999 999 999" />
          </div>
        </div>

        <button type="button" className="submit-btn submit-btn-blue">
          👁️ Enviar avistamiento
        </button>
      </div>
    </ModalContenedor>
  );
}
