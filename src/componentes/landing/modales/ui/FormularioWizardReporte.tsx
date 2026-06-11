/**
 * [landing] Formulario: wizard reporte.
 */
import { AvisoBorradorReporte } from "@/componentes/landing/modales/AvisoBorradorReporte";
import { PasosWizard } from "@/componentes/landing/modales/PasosWizard";
import type { PasoWizard } from "@/hooks/useWizardReporte";

type Props = {
  formRef: React.RefObject<HTMLFormElement | null>;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  avisoBorrador: boolean;
  error: string | null;
  pasos: readonly PasoWizard[];
  pasoActivo: number;
  etiquetaPasos: string;
  children: React.ReactNode;
};

export function FormularioWizardReporte({
  formRef,
  onSubmit,
  avisoBorrador,
  error,
  pasos,
  pasoActivo,
  etiquetaPasos,
  children,
}: Props) {
  return (
    <form ref={formRef} className="modal-body" noValidate onSubmit={onSubmit}>
      <AvisoBorradorReporte visible={avisoBorrador} />
      {error && (
        <p className="auth-alerta auth-alerta--error" role="alert">
          {error}
        </p>
      )}
      <PasosWizard
        pasos={pasos}
        pasoActivo={pasoActivo}
        etiqueta={etiquetaPasos}
      />
      {children}
    </form>
  );
}
