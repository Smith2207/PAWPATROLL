/**
 * [avistamiento] Wizard paso 1: foto de evidencia + búsqueda por IA.
 */
import { SubirFotoAvistamiento } from "@/componentes/avistamientos/SubirFotoAvistamiento";
import { IdentificacionPorFoto } from "@/componentes/visual/IdentificacionPorFoto";
import { Icono } from "@/componentes/ui/Icono";
import type { UbicacionSeleccionada } from "@/lib/geo/tipos";
import type { CoincidenciaVisual } from "@/lib/visual/tipos";
import type { CaracteristicasVisuales } from "@/lib/visual/extraer-caracteristicas";

type Props = {
  fotoAvistamiento: string | null;
  onFotoChange: (foto: string | null) => void;
  identificadaPorFoto: CoincidenciaVisual | null;
  onElegirCoincidencia: (c: CoincidenciaVisual) => void;
  onCaracteristicas: (c: CaracteristicasVisuales) => void;
  tipo: string;
  color: string;
  ubicacion: UbicacionSeleccionada | null;
};

export function PasoFotoAvistamiento({
  fotoAvistamiento,
  onFotoChange,
  identificadaPorFoto,
  onElegirCoincidencia,
  onCaracteristicas,
  tipo,
  color,
  ubicacion,
}: Props) {
  return (
    <>
      <div className="section-divider">
        <Icono nombre="camara" size={16} className="pp-icon--btn" /> Foto
        (recomendada)
      </div>
      <SubirFotoAvistamiento foto={fotoAvistamiento} onChange={onFotoChange} />
      <div className="section-divider">Buscar coincidencias</div>
      <p className="form-ficha-ayuda" style={{ marginTop: 0 }}>
        Opcional: sube otra foto aquí solo para comparar con mascotas perdidas.
        Es independiente de la foto de evidencia de arriba.
      </p>
      <IdentificacionPorFoto
        compacto
        onElegir={onElegirCoincidencia}
        onCaracteristicas={onCaracteristicas}
        mascotaSeleccionadaId={identificadaPorFoto?.mascotaId}
        filtros={{
          tipoMascota: tipo || undefined,
          color: color.trim() || undefined,
          lat: ubicacion?.lat,
          lng: ubicacion?.lng,
        }}
      />
      {identificadaPorFoto && (
        <div className="foto-ia-seleccion-banner" role="status">
          <span className="foto-ia-seleccion-banner-icono">
            <Icono nombre="check" size={18} />
          </span>
          <div>
            <strong>{identificadaPorFoto.nombre}</strong> seleccionada
            <p>El avistamiento quedará vinculado a esta mascota.</p>
          </div>
        </div>
      )}
    </>
  );
}
