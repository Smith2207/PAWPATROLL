import { auth } from "@/auth";
import { FormularioRegistro } from "@/componentes/auth/FormularioRegistro";
import Link from "next/link";
import { redirect } from "next/navigation";
import "@/estilos/auth.css";

export default async function PaginaRegistro() {
  const sesion = await auth();
  if (sesion?.user) redirect("/perfil");

  return (
    <>
      <FormularioRegistro />
      <p style={{ textAlign: "center", paddingBottom: "2rem" }}>
        <Link href="/">← Volver al inicio</Link>
      </p>
    </>
  );
}
