import { auth } from "@/auth";
import { EncabezadoModuloMascotas } from "@/componentes/mascotas/EncabezadoModuloMascotas";
import { FormularioFichaMascota } from "@/componentes/mascotas/FormularioFichaMascota";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EnvolturaPaginasApp } from "@/componentes/layout/EnvolturaPaginasApp";

export default async function PaginaNuevaFichaMascota() {
  const sesion = await auth();
  if (!sesion?.user) redirect("/");

  return (
    <EnvolturaPaginasApp>
      <div className="panel-cuenta panel-cuenta--form-ficha">
        <EncabezadoModuloMascotas
          titulo="Nueva ficha de mascota"
          subtitulo="Nombre, tipo y una foto bastan para empezar. Lo demás es opcional."
          ocultarBotonNueva
        />

        <div className="tarjeta-panel tarjeta-panel--form-ficha">
          <FormularioFichaMascota modo="crear" />
        </div>

        <p className="auth-enlace form-ficha-volver">
          <Link href="/mis-mascotas">← Mis fichas</Link>
        </p>
      </div>
    </EnvolturaPaginasApp>
  );
}
