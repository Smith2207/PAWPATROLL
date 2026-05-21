import { redirect } from "next/navigation";

/** Ruta antigua → nueva ficha */
export default function RedirigirNuevaMascota() {
  redirect("/mis-mascotas/ficha");
}
