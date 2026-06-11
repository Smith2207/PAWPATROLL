/**
 * [casos] Metadatos: participante chat.
 */
import { EtiquetaRolParticipante } from "@/componentes/casos/EtiquetaRolParticipante";
import type { RolConversacion } from "@/lib/chat/roles";

type Props = {
  rol: RolConversacion;
  numeroReporte: number;
  className?: string;
};

export function MetaParticipanteChat({ rol, numeroReporte, className = "" }: Props) {
  return (
    <span className={`pp-coord-chat-header-meta ${className}`.trim()}>
      <EtiquetaRolParticipante rol={rol} className="pp-coord-chat-header-rol" />
      <span className="pp-coord-avistamiento-ref">Avistamiento #{numeroReporte}</span>
    </span>
  );
}
