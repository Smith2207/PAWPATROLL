/**
 * [avistamiento] Wizard paso mapa: dónde se vio la mascota.
 */
import { SubirFotoAvistamiento } from "@/componentes/avistamientos/SubirFotoAvistamiento";
import { SeccionUbicacionReporte } from "@/componentes/landing/modales/ui/SeccionUbicacionReporte";
import type { UbicacionSeleccionada } from "@/lib/geo/tipos";

type Props = {
  avistamientoDesdeFicha: boolean;
  ubicacion: UbicacionSeleccionada | null;
  onUbicacionChange: (u: UbicacionSeleccionada | null) => void;
  direccion: string;
  onDireccionChange: (d: string) => void;
  fotoAvistamiento: string | null;
  onFotoChange: (foto: string | null) => void;
};

export function PasoUbicacionAvistamiento({
  avistamientoDesdeFicha,
  ubicacion,
  onUbicacionChange,
  direccion,
  onDireccionChange,
  fotoAvistamiento,
  onFotoChange,
}: Props) {
  return (
    <SeccionUbicacionReporte
      tituloSeccion="Ubicación donde la viste"
      etiqueta="¿Dónde la viste? *"
      idInput="sighting-location"
      icono="ojo"
      valor={ubicacion}
      onChange={onUbicacionChange}
      direccion={direccion}
      onDireccionChange={onDireccionChange}
    >
      {avistamientoDesdeFicha && (
        <>
          <div className="section-divider">Foto del avistamiento (opcional)</div>
          <SubirFotoAvistamiento foto={fotoAvistamiento} onChange={onFotoChange} />
        </>
      )}
    </SeccionUbicacionReporte>
  );
}
