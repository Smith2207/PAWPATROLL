/**
 * [landing] Contenedor: modal wizard de reporte (pérdida / avistamiento).
 */
import { ModalContenedor } from "@/componentes/landing/modales/ModalContenedor";
import { EncabezadoModalReporte } from "@/componentes/landing/modales/ui/EncabezadoModalReporte";
import { OverlayPublicando } from "@/componentes/ui/OverlayPublicando";
import type { TipoModal } from "@/contexto/ContextoModales";

type Props = {
  tipo: TipoModal;
  publicando: boolean;
  mensajePublicando: string;
  titulo: React.ReactNode;
  subtitulo: React.ReactNode;
  accent?: "default" | "mint" | "blue";
  children: React.ReactNode;
};

export function ShellModalReporte({
  tipo,
  publicando,
  mensajePublicando,
  titulo,
  subtitulo,
  accent,
  children,
}: Props) {
  return (
    <ModalContenedor tipo={tipo}>
      <OverlayPublicando visible={publicando} mensaje={mensajePublicando} />
      <EncabezadoModalReporte
        tipo={tipo}
        accent={accent}
        titulo={titulo}
        subtitulo={subtitulo}
      />
      {children}
    </ModalContenedor>
  );
}
