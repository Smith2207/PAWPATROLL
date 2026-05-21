import { auth } from "@/auth";
import { EncabezadoModuloMascotas } from "@/componentes/mascotas/EncabezadoModuloMascotas";
import { FormularioFichaMascota } from "@/componentes/mascotas/FormularioFichaMascota";
import Link from "next/link";
import { redirect } from "next/navigation";
import "@/estilos/auth.css";
import "@/estilos/mascotas.css";

export default async function PaginaNuevaMascota() {
  const sesion = await auth();
  if (!sesion?.user) redirect("/iniciar-sesion");

  return (
    <div className="panel-cuenta">
      <EncabezadoModuloMascotas
        titulo="Alta de mascota"
        subtitulo="Completa la ficha digital con datos, fotos e identificación."
      />

      <div className="tarjeta-panel" style={{ maxWidth: 720 }}>
        <FormularioFichaMascota modo="crear" />
      </div>

      <p className="auth-enlace" style={{ marginTop: "1.5rem" }}>
        <Link href="/mis-mascotas">← Volver al listado</Link>
      </p>
    </div>
  );
}
