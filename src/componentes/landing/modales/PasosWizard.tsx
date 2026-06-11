/**
 * [landing] Componente React: pasos wizard.
 */
import type { PasoWizard } from "@/lib/reportes/pasos-wizard";

type Props = {
  pasos: readonly PasoWizard[];
  pasoActivo: number;
  etiqueta?: string;
};

export function PasosWizard({ pasos, pasoActivo, etiqueta = "Progreso" }: Props) {
  return (
    <div className="auth-pasos" aria-label={etiqueta}>
      {pasos.map((p) => (
        <div
          key={p.id}
          className={`auth-paso ${pasoActivo === p.id ? "auth-paso--activo" : ""} ${pasoActivo > p.id ? "auth-paso--hecho" : ""}`}
        >
          <span className="auth-paso-num">{p.id}</span>
          <span className="auth-paso-titulo">{p.titulo}</span>
        </div>
      ))}
    </div>
  );
}
