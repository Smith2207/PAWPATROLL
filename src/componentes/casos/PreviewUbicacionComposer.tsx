"use client";



/**
 * [casos] Componente React: preview ubicacion composer.
 */
/**
 * [casos] Componente React: preview ubicacion composer.
 */
import {
  urlMapaEstaticoChat,
  type UbicacionChat,
} from "@/lib/chat/ubicacion-mensaje";
import { ETIQUETA_GPS, pareceCoordenadas } from "@/lib/geo/etiqueta-ubicacion";
import type { UbicacionSeleccionada } from "@/lib/geo/tipos";
import { Icono } from "@/componentes/ui/Icono";

type Props = {
  seleccion: UbicacionSeleccionada;
  enviando?: boolean;
  onEnviar: () => void;
  onCancelar: () => void;
};

function etiquetaUbicacion(seleccion: UbicacionSeleccionada): string {
  const texto = seleccion.etiqueta?.trim();
  if (texto && !pareceCoordenadas(texto)) return texto;
  return ETIQUETA_GPS;
}

export function PreviewUbicacionComposer({
  seleccion,
  enviando,
  onEnviar,
  onCancelar,
}: Props) {
  const label = etiquetaUbicacion(seleccion);
  const mapa = urlMapaEstaticoChat(seleccion.lat, seleccion.lng, 320, 160);

  const vista: UbicacionChat = {
    lat: seleccion.lat,
    lng: seleccion.lng,
    label,
    enVivo: true,
  };

  return (
    <div
      className="pp-chat-ubicacion-preview"
      role="region"
      aria-label="Vista previa de ubicación"
    >
      <div className="pp-chat-ubicacion-preview-header">
        <strong>Enviar ubicación</strong>
        <button
          type="button"
          className="pp-chat-ubicacion-preview-cerrar"
          onClick={onCancelar}
          disabled={enviando}
          aria-label="Cancelar ubicación"
        >
          <Icono nombre="cerrar" size={16} />
        </button>
      </div>

      <div className="pp-chat-ubicacion-preview-mapa">
        <img src={mapa} alt="Vista previa del mapa" decoding="async" />
        <span className="pp-chat-ubicacion-preview-badge">Ubicación en vivo</span>
      </div>

      <p className="pp-chat-ubicacion-preview-etiqueta">{vista.label}</p>
    

      <div className="pp-chat-ubicacion-preview-acciones">
        <button
          type="button"
          className="pp-coord-btn"
          onClick={onCancelar}
          disabled={enviando}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="pp-coord-btn pp-coord-btn--primario"
          onClick={onEnviar}
          disabled={enviando}
        >
          {enviando ? "Enviando…" : "Enviar ubicación"}
        </button>
      </div>
    </div>
  );
}
