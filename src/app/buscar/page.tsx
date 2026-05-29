import { RUTAS_LANDING } from "@/lib/landing/rutas";
import { redirect } from "next/navigation";

/** Antigua ruta duplicada: unificada con casos activos. */
export default function RedirigirBuscar() {
  redirect(RUTAS_LANDING.casosActivos);
}
