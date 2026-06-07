import type { DatosMapaMascota } from "@/actions/mapa";
import { MapaMascotaFicha } from "@/componentes/mascotas/MapaMascotaFicha";
import { PanelComportamiento } from "@/componentes/comportamiento/PanelComportamiento";

type Props = {
  mascota: {
    id: string;
    nombre: string;
    tipo: string;
    color: string | null;
    raza: string | null;
  };
  datosMapa: DatosMapaMascota;
};

/** Mapa + panel M5 (cerco dinámico, calor, refugios, consejos y referencias). */
export function SeccionBusquedaInteligente({ mascota, datosMapa }: Props) {
  const tieneContenido =
    datosMapa.prediccion != null ||
    datosMapa.perdidas.length > 0 ||
    datosMapa.avistamientos.length > 0;

  if (!tieneContenido) return null;

  if (datosMapa.mascotaId !== mascota.id) {
    return null;
  }

  const tituloId = `busqueda-inteligente-${mascota.id}`;

  return (
    <section
      className="pp-busqueda-inteligente"
      id={tituloId}
      aria-labelledby={tituloId}
    >
      <MapaMascotaFicha
        nombre={mascota.nombre}
        mascotaId={mascota.id}
        tipo={mascota.tipo}
        color={mascota.color}
        raza={mascota.raza}
        datos={datosMapa}
      />
      {datosMapa.prediccion && (
        <PanelComportamiento
          prediccion={datosMapa.prediccion}
          nombreMascota={mascota.nombre}
          mascotaId={mascota.id}
        />
      )}
    </section>
  );
}
