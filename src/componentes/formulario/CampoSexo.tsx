import { SEXOS } from "@/lib/mascotas/catalogos";

type Props = {
  name?: string;
  defaultValue?: string;
  label?: string;
};

export function CampoSexo({
  name = "sexo",
  defaultValue = "",
  label = "Sexo",
}: Props) {
  return (
    <div className="form-group">
      <label>{label}</label>
      <select name={name} defaultValue={defaultValue}>
        <option value="">Seleccionar...</option>
        {SEXOS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}
