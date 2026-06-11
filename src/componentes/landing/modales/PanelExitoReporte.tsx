/**
 * [landing] Panel: exito reporte.
 */
import { BotonCerrarModal, ModalContenedor } from "@/componentes/landing/modales/ModalContenedor";
import { Icono } from "@/componentes/ui/Icono";
import type { TipoModal } from "@/contexto/ContextoModales";

type Props = {
  tipo: TipoModal;
  titulo: string;
  subtitulo: string;
  mensaje: string;
  accentMint?: boolean;
  tituloExito?: string;
  onVerMapa: () => void;
  onCerrar: () => void;
  children?: React.ReactNode;
};

export function PanelExitoReporte({
  tipo,
  titulo,
  subtitulo,
  mensaje,
  accentMint,
  tituloExito = "¡Publicado correctamente!",
  onVerMapa,
  onCerrar,
  children,
}: Props) {
  return (
    <ModalContenedor tipo={tipo}>
      <div className="modal-header">
        <div
          className={`modal-header-accent${accentMint ? " modal-header-accent--mint" : ""}`}
        />
        <BotonCerrarModal tipo={tipo} />
        <div className="modal-title">{titulo}</div>
        <div className="modal-sub">{subtitulo}</div>
      </div>
      <div className="modal-body pp-avistamiento-exito-panel">
        <div className="pp-avistamiento-exito" role="status">
          <span className="pp-avistamiento-exito-icono">
            <Icono nombre="checkCirculo" size={28} />
          </span>
          <div>
            <strong>{tituloExito}</strong>
            <p>{mensaje}</p>
          </div>
        </div>
        {children}
        <button type="button" className="submit-btn submit-btn-blue" onClick={onVerMapa}>
          <Icono nombre="mapa" size={18} className="pp-icon--btn" /> Ver en el mapa
        </button>
        <button type="button" className="submit-btn" onClick={onCerrar}>
          Cerrar
        </button>
      </div>
    </ModalContenedor>
  );
}
