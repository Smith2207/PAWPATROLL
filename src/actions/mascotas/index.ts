export type { FiltrosBusquedaMascotasPublicas } from "@/actions/mascotas/consultas";

export {
  listarMisMascotas,
  buscarMascotasPublicas,
  listarMascotasPerdidasPublicas,
  obtenerMascotaPropia,
  obtenerMascotaPublica,
} from "@/actions/mascotas/consultas";

export {
  crearMascota,
  actualizarMascota,
  cambiarEstadoMascota,
  eliminarMascota,
} from "@/actions/mascotas/mutaciones";
