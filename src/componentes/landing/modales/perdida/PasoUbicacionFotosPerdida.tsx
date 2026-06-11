/**
 * [perdida] Wizard paso 1: ubicación y fotos de la mascota.
 */
import { FormularioFotosMascota } from "@/componentes/landing/modales/FormularioFotosMascota";
import { SeccionUbicacionReporte } from "@/componentes/landing/modales/ui/SeccionUbicacionReporte";
import type { CamaraReporteApi } from "@/hooks/useCamaraReporte";
import type { UbicacionSeleccionada } from "@/lib/geo/tipos";

type Props = {
  ubicacion: UbicacionSeleccionada | null;
  onUbicacionChange: (u: UbicacionSeleccionada | null) => void;
  direccion: string;
  onDireccionChange: (d: string) => void;
  referenciasZona: string;
  onReferenciasZonaChange: (v: string) => void;
  camara: CamaraReporteApi;
};

export function PasoUbicacionFotosPerdida({
  ubicacion,
  onUbicacionChange,
  direccion,
  onDireccionChange,
  referenciasZona,
  onReferenciasZonaChange,
  camara,
}: Props) {
  return (
    <>
      <SeccionUbicacionReporte
        tituloSeccion="Ubicación donde se perdió"
        etiqueta="¿Dónde se perdió? *"
        idInput="report-location"
        icono="ubicacion"
        valor={ubicacion}
        onChange={onUbicacionChange}
        direccion={direccion}
        onDireccionChange={onDireccionChange}
      >
        <div className="form-group">
          <label htmlFor="referenciasZona">Referencias adicionales de la zona</label>
          <input
            id="referenciasZona"
            name="referenciasZona"
            type="text"
            placeholder="Ej: Cerca al mercado, frente al parque..."
            value={referenciasZona}
            onChange={(e) => onReferenciasZonaChange(e.target.value)}
          />
        </div>
      </SeccionUbicacionReporte>
      <FormularioFotosMascota camara={camara} />
    </>
  );
}
