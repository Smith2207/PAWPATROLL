/**
 * [mascotas] Componente React: resumen mis casos perdida.
 */
import { AccesoCoordinacion } from "@/componentes/mascotas/AccesoCoordinacion";
import type { EstadoMascota } from "@/lib/db/schema";

type MascotaCaso = {
  id: string;
  nombre: string;
  tipo: string;
  fotoPrincipal?: string | null;
  estado: EstadoMascota;
  avistamientosPendientes?: number;
  totalAvistamientos?: number;
};

type Props = {
  mascotas: MascotaCaso[];
};

/** Fichas propias en estado PERDIDA (casos donde el usuario es dueño de la ficha). */
export function ResumenMisCasosPerdida({ mascotas }: Props) {
  const perdidas = mascotas.filter((m) => m.estado === "PERDIDA");
  if (perdidas.length === 0) return null;

  return (
    <section
      className="mascotas-casos-resumen"
      id="casos-activos"
      aria-labelledby="mascotas-casos-titulo"
    >
      <header className="mascotas-casos-resumen-cabecera">
        <h2 id="mascotas-casos-titulo">Tus mensajes</h2>
        <p>Toca una mascota para ver conversaciones y avistamientos.</p>
      </header>
      <ul className="mascotas-casos-resumen-lista">
        {perdidas.map((m) => (
          <li key={m.id}>
            <AccesoCoordinacion
              mascotaId={m.id}
              nombreMascota={m.nombre}
              tipo={m.tipo}
              fotoPrincipal={m.fotoPrincipal}
              avistamientosPendientes={m.avistamientosPendientes}
              totalAvistamientos={m.totalAvistamientos}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
