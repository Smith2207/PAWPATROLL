/**
 * [avistamiento] Wizard paso final: confirmar datos y publicar.
 */
import { CampoFechaHora } from "@/componentes/formulario/CampoFechaHora";
import { CampoRaza } from "@/componentes/formulario/CampoRaza";
import { CampoTamano } from "@/componentes/formulario/CampoTamano";
import { CampoTipoMascota } from "@/componentes/formulario/CampoTipoMascota";
import { DIRECCIONES_MOVIMIENTO } from "@/lib/mascotas/catalogos";

type MascotaPerdidaOpcion = { id: string; nombre: string; slug: string };

type Props = {
  avistamientoDesdeFicha: boolean;
  mascotaFijadaTipo?: string | null;
  mascotasPerdidas: MascotaPerdidaOpcion[];
  mascotaSeleccionada: string;
  onMascotaSeleccionadaChange: (id: string) => void;
  tipo: string;
  onTipoChange: (tipo: string) => void;
  tamano: string;
  onTamanoChange: (t: string) => void;
  fechaAvistamiento: string;
  onFechaAvistamientoChange: (v: string) => void;
  detallesAbiertos: boolean;
  onDetallesAbiertosChange: (v: boolean) => void;
  color: string;
  onColorChange: (v: string) => void;
  razaSeleccion: string;
  razaOtra: string;
  onRazaSeleccionChange: (v: string) => void;
  onRazaOtraChange: (v: string) => void;
  direccionMovimiento: string;
  onDireccionMovimientoChange: (v: string) => void;
  referencias: string;
  onReferenciasChange: (v: string) => void;
};

export function PasoPublicarAvistamiento({
  avistamientoDesdeFicha,
  mascotaFijadaTipo,
  mascotasPerdidas,
  mascotaSeleccionada,
  onMascotaSeleccionadaChange,
  tipo,
  onTipoChange,
  tamano,
  onTamanoChange,
  fechaAvistamiento,
  onFechaAvistamientoChange,
  detallesAbiertos,
  onDetallesAbiertosChange,
  color,
  onColorChange,
  razaSeleccion,
  razaOtra,
  onRazaSeleccionChange,
  onRazaOtraChange,
  direccionMovimiento,
  onDireccionMovimientoChange,
  referencias,
  onReferenciasChange,
}: Props) {
  return (
    <>
      {!avistamientoDesdeFicha && mascotasPerdidas.length > 0 && (
        <div className="form-group">
          <label>¿De qué mascota perdida es el avistamiento?</label>
          <select
            name="mascotaId"
            value={mascotaSeleccionada}
            onChange={(e) => onMascotaSeleccionadaChange(e.target.value)}
          >
            <option value="">No estoy seguro / avistamiento general</option>
            {mascotasPerdidas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="form-row">
        <CampoTipoMascota
          value={tipo}
          onChange={onTipoChange}
          requerido
          deshabilitado={avistamientoDesdeFicha && Boolean(mascotaFijadaTipo)}
          label="¿Perro o gato?"
        />
        <CampoTamano
          label="Tamaño aproximado"
          vacio="—"
          value={tamano}
          onChange={onTamanoChange}
        />
      </div>

      <CampoFechaHora
        label="Fecha y hora del avistamiento"
        id="sighting-datetime"
        value={fechaAvistamiento}
        onChange={onFechaAvistamientoChange}
        requerido
      />

      <button
        type="button"
        className="pp-detalles-toggle"
        aria-expanded={detallesAbiertos}
        onClick={() => onDetallesAbiertosChange(!detallesAbiertos)}
      >
        {detallesAbiertos ? "▾ Ocultar detalles" : "▸ Añadir más detalles (opcional)"}
      </button>

      {detallesAbiertos && (
        <>
          <div className="form-row">
            <div className="form-group">
              <label>Color principal</label>
              <input
                name="color"
                type="text"
                value={color}
                onChange={(e) => onColorChange(e.target.value)}
                placeholder="Ej: negro con blanco"
              />
            </div>
            <CampoRaza
              tipo={tipo}
              seleccion={razaSeleccion}
              otra={razaOtra}
              onSeleccionChange={onRazaSeleccionChange}
              onOtraChange={onRazaOtraChange}
              label="Raza (si la identificas)"
            />
          </div>
          <div className="form-group">
            <label>¿En qué dirección se movía?</label>
            <select
              name="direccionMovimiento"
              value={direccionMovimiento}
              onChange={(e) => onDireccionMovimientoChange(e.target.value)}
            >
              {DIRECCIONES_MOVIMIENTO.map((d) => (
                <option key={d} value={d === "No lo noté" ? "" : d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Referencia y más detalles</label>
            <textarea
              name="referencia"
              rows={3}
              value={referencias}
              onChange={(e) => onReferenciasChange(e.target.value)}
              placeholder="Ej: Llevaba collar rojo, esquina con la farmacia..."
            />
          </div>
        </>
      )}
    </>
  );
}
