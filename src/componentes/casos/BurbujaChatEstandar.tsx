import type { ReactNode } from "react";
import { Icono, type NombreIcono } from "@/componentes/ui/Icono";

type Props = {
  /** Solo posición en la fila (izquierda / derecha / centro); no cambia colores ni bordes. */
  alineacion?: "propio" | "ajeno" | "centro";
  media?: ReactNode;
  /** Título de evento del sistema (con icono). */
  titulo?: string | null;
  icono?: NombreIcono;
  /** Texto del mensaje o detalle del evento. */
  texto?: string | null;
  meta: ReactNode;
};

function claseIconoEvento(icono: NombreIcono) {
  if (icono === "alerta" || icono === "alertaCirculo") return " pp-chat-burbuja-icono--alerta";
  if (icono === "ubicacion" || icono === "mapa") return " pp-chat-burbuja-icono--ubicacion";
  if (icono === "check" || icono === "checkCirculo") return " pp-chat-burbuja-icono--ok";
  return "";
}

/** Burbuja única del chat: media (foto / mapa) + cola (texto + hora). Misma apariencia siempre. */
export function BurbujaChatEstandar({
  alineacion = "ajeno",
  media,
  titulo,
  icono,
  texto,
  meta,
}: Props) {
  const filaClase =
    alineacion === "propio"
      ? " pp-chat-fila--propio"
      : alineacion === "centro"
        ? " pp-chat-fila--centro"
        : " pp-chat-fila--ajeno";

  const tieneMedia = Boolean(media);
  const tieneTitulo = Boolean(titulo?.trim());
  const tieneTexto = Boolean(texto?.trim());

  return (
    <div className={`pp-chat-fila${filaClase}`}>
      <div className="pp-chat-burbuja pp-chat-burbuja--coord">
        <div className="pp-chat-burbuja-cuerpo">
          {tieneMedia && <div className="pp-chat-burbuja-media">{media}</div>}
          <div className="pp-chat-burbuja-cola">
            {tieneTitulo ? (
              <div className="pp-chat-burbuja-bloque-texto">
                <div className="pp-chat-burbuja-encabezado">
                  {icono && (
                    <span
                      className={`pp-chat-burbuja-icono${claseIconoEvento(icono)}`}
                      aria-hidden
                    >
                      <Icono nombre={icono} size={16} strokeWidth={2.25} />
                    </span>
                  )}
                  <span className="pp-chat-burbuja-texto">{titulo}</span>
                </div>
                {tieneTexto ? (
                  <p className="pp-chat-burbuja-texto pp-chat-burbuja-texto--detalle">{texto}</p>
                ) : null}
              </div>
            ) : tieneTexto ? (
              <span className="pp-chat-burbuja-texto">{texto}</span>
            ) : null}
            {meta}
          </div>
        </div>
      </div>
    </div>
  );
}
