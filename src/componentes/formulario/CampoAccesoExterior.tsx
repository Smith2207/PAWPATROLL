import {
  ayudaCampoAccesoExterior,
  etiquetaCampoAccesoExterior,
  opcionesAccesoExterior,
} from "@/lib/mascotas/opciones-acceso-exterior";

type Props = {
  tipo?: string;
  defaultValue?: string | null;
  requerido?: boolean;
};

export function CampoAccesoExterior({
  tipo,
  defaultValue,
  requerido,
}: Props) {
  const opciones = opcionesAccesoExterior(tipo);
  const sinTipo = !tipo?.trim();

  return (
    <div className="form-group">
      <label htmlFor="accesoExterior">
        {etiquetaCampoAccesoExterior(tipo)} {requerido ? "*" : ""}
      </label>
      <select
        id="accesoExterior"
        name="accesoExterior"
        key={tipo ?? "sin-tipo"}
        defaultValue={defaultValue ?? ""}
        required={requerido && !sinTipo}
        disabled={sinTipo && requerido}
      >
        <option value="" disabled={requerido}>
          {sinTipo
            ? "Primero elige perro o gato arriba"
            : requerido
              ? "Selecciona la más parecida"
              : "No indicado"}
        </option>
        {opciones.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <p className="form-ficha-ayuda">{ayudaCampoAccesoExterior()}</p>
    </div>
  );
}
