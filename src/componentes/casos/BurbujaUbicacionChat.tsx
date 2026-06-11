/**
 * [casos] Burbuja: ubicacion chat.
 */
import {
  urlAbrirUbicacionEnMaps,
  urlMapaEstaticoChat,
  type UbicacionChat,
} from "@/lib/chat/ubicacion-mensaje";

type Props = {
  ubicacion: UbicacionChat;
};

export function BurbujaUbicacionChat({ ubicacion }: Props) {
  const mapa = urlMapaEstaticoChat(ubicacion.lat, ubicacion.lng);
  const enlace = urlAbrirUbicacionEnMaps(ubicacion.lat, ubicacion.lng);

  return (
    <a
      href={enlace}
      target="_blank"
      rel="noopener noreferrer"
      className="pp-chat-ubicacion"
      aria-label={`Abrir ubicación: ${ubicacion.label}`}
    >
      <img
        src={mapa}
        alt="Mapa de ubicación en vivo"
        className="pp-chat-ubicacion-mapa"
        loading="lazy"
        decoding="async"
      />
      {ubicacion.enVivo && (
        <span className="pp-chat-ubicacion-tipo">Ubicación en vivo</span>
      )}
      <span className="pp-chat-ubicacion-etiqueta">{ubicacion.label}</span>
    </a>
  );
}
