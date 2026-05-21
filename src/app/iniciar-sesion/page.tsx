import { redirect } from "next/navigation";

/** La sesión se abre en el modal de la landing; esta ruta solo redirige al inicio. */
export default function PaginaIniciarSesionRedirigir() {
  redirect("/");
}
