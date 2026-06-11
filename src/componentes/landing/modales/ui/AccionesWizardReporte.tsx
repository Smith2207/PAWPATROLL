import { Icono } from "@/componentes/ui/Icono";

type Props = {
  paso: number;
  pasoFinal: number;
  publicando: boolean;
  irAtras: () => void;
  textoCargando: string;
  textoEnviar: React.ReactNode;
  classNameSubmit?: string;
};

export function AccionesWizardReporte({
  paso,
  pasoFinal,
  publicando,
  irAtras,
  textoCargando,
  textoEnviar,
  classNameSubmit = "submit-btn",
}: Props) {
  return (
    <div className="auth-pasos-acciones">
      {paso > 1 && (
        <button
          type="button"
          className="btn-mascota btn-mascota--secundario"
          onClick={irAtras}
          disabled={publicando}
        >
          Atrás
        </button>
      )}
      <button
        type="submit"
        className={classNameSubmit}
        disabled={publicando}
      >
        {publicando ? (
          textoCargando
        ) : paso < pasoFinal ? (
          "Continuar"
        ) : (
          textoEnviar
        )}
      </button>
    </div>
  );
}

type PropsConIcono = Props & {
  iconoEnviar: "alerta" | "ojo";
};

export function AccionesWizardReporteConIcono({
  iconoEnviar,
  textoEnviar,
  ...rest
}: PropsConIcono) {
  return (
    <AccionesWizardReporte
      {...rest}
      textoEnviar={
        <>
          <Icono nombre={iconoEnviar} size={18} className="pp-icon--btn" />{" "}
          {textoEnviar}
        </>
      }
    />
  );
}
