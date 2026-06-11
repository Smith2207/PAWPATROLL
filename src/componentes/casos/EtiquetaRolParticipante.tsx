/**
 * [casos] Etiqueta: rol participante.
 */
import { ETIQUETA_ROL, type RolConversacion } from "@/lib/chat/roles";

type Props = {
  rol: RolConversacion;
  className?: string;
};

export function EtiquetaRolParticipante({ rol, className = "" }: Props) {
  return (
    <span className={`pp-coord-rol pp-coord-rol--${rol} ${className}`.trim()}>
      {ETIQUETA_ROL[rol]}
    </span>
  );
}
