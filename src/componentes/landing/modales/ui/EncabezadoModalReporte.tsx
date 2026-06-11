/**
 * [landing] Encabezado: modal reporte.
 */
import {
  BotonCerrarModal,
} from "@/componentes/landing/modales/ModalContenedor";
import type { TipoModal } from "@/contexto/ContextoModales";

type Props = {
  tipo: TipoModal;
  titulo: React.ReactNode;
  subtitulo: React.ReactNode;
  accent?: "default" | "mint" | "blue";
};

export function EncabezadoModalReporte({
  tipo,
  titulo,
  subtitulo,
  accent = "default",
}: Props) {
  const claseAccent =
    accent === "mint"
      ? "modal-header-accent modal-header-accent--mint"
      : accent === "blue"
        ? "modal-header-accent modal-header-accent--blue"
        : "modal-header-accent";

  return (
    <div className="modal-header">
      <div className={claseAccent} />
      <BotonCerrarModal tipo={tipo} />
      <div className="modal-title">{titulo}</div>
      <div className="modal-sub">{subtitulo}</div>
    </div>
  );
}
