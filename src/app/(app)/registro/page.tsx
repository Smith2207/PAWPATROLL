/**
 * Ruta /registro. Página principal de la ruta.
 */
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function PaginaRegistro() {
  const sesion = await auth();
  if (sesion?.user) redirect("/");

  redirect("/?registro=1");
}
