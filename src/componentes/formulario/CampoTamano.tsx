import { TAMANOS } from "@/lib/mascotas/catalogos";

type Props = {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (valor: string) => void;
  label?: string;
  requerido?: boolean;
  vacio?: string;
};

export function CampoTamano({
  name = "tamano",
  value,
  defaultValue = "",
  onChange,
  label = "Tamaño",
  requerido = false,
  vacio = "Seleccionar...",
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
      >
        <option value="">{vacio}</option>
        {TAMANOS.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </div>
  );
}
