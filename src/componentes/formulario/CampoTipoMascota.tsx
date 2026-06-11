import { OPCIONES_TIPO } from "@/lib/mascotas/tipos";

type Props = {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (valor: string) => void;
  label?: string;
  requerido?: boolean;
  deshabilitado?: boolean;
};

export function CampoTipoMascota({
  name = "tipo",
  value,
  defaultValue = "",
  onChange,
  label = "Perro o gato",
  requerido = false,
  deshabilitado = false,
}: Props) {
  const controlado = value !== undefined;

  return (
    <div className="form-group">
      <label>
        {label}
        {requerido ? " *" : ""}
      </label>
      <select
        name={name}
        value={controlado ? value : undefined}
        defaultValue={controlado ? undefined : defaultValue}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        required={requerido}
        disabled={deshabilitado}
      >
        <option value="">Seleccionar...</option>
        {OPCIONES_TIPO.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
