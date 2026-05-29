import type { AccesoExterior } from "@/lib/comportamiento/contexto-busqueda";

const OPCIONES: { value: AccesoExterior; label: string; hint: string }[] = [
  {
    value: "solo_interior",
    label: "Solo interior",
    hint: "No sale al exterior (gatos: ~137 m mediana en estudios)",
  },
  {
    value: "patio_supervisado",
    label: "Patio o balcón",
    hint: "Sale solo a espacio cerrado o supervisado",
  },
  {
    value: "exterior_habitual",
    label: "Sale al exterior con libertad",
    hint: "Gatos: ~75% hallados dentro de 500 m",
  },
];

type Props = {
  defaultValue?: string | null;
  requerido?: boolean;
};

export function CampoAccesoExterior({ defaultValue, requerido }: Props) {
  return (
    <div className="form-group">
      <label htmlFor="accesoExterior">
        ¿Sale al exterior? {requerido ? "*" : ""}
      </label>
      <select
        id="accesoExterior"
        name="accesoExterior"
        defaultValue={defaultValue ?? ""}
        required={requerido}
      >
        <option value="" disabled={requerido}>
          {requerido ? "Selecciona una opción" : "No indicado (se estimará)"}
        </option>
        {OPCIONES.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label} — {o.hint}
          </option>
        ))}
      </select>
      <p className="form-ficha-ayuda">
        Ajusta el cerco de búsqueda según estudios de mascotas perdidas (Huang et
        al., MAR).
      </p>
    </div>
  );
}
