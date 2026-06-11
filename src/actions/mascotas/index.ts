/**
 * Barrel: reexporta acciones del módulo mascotas.
 */
export type { FiltrosBusquedaMascotasPublicas } from "@/actions/mascotas/consultas";

export {
  listarMisMascotas,
  buscarMascotasPublicas,
  listarMascotasPerdidasPublicas,
  obtenerMascotaPropia,
  obtenerMascotaPublica,
  esDuenoDeFicha,
} from "@/actions/mascotas/consultas";

export {
  obtenerResumenCasosNav,
  type ResumenCasosNav,
} from "@/actions/mascotas/consultas-nav";

export {
  crearMascota,
  actualizarMascota,
  cambiarEstadoMascota,
  eliminarMascota,
} from "@/actions/mascotas/mutaciones";
