import { obtenerContactoPerfil } from "@/actions/autenticacion";
import { auth } from "@/auth";
import { EncabezadoModuloMascotas } from "@/componentes/mascotas/EncabezadoModuloMascotas";
import { FormularioFichaMascota } from "@/componentes/mascotas/FormularioFichaMascota";
import { Icono } from "@/componentes/ui/Icono";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EnvolturaPaginasApp } from "@/componentes/layout/EnvolturaPaginasApp";

export default async function PaginaNuevaFichaMascota() {
  const sesion = await auth();
  if (!sesion?.user) redirect("/");

  const contactoPerfil = await obtenerContactoPerfil();

  return (
    <EnvolturaPaginasApp>
      <div className="panel-cuenta panel-cuenta--form-ficha">
        <EncabezadoModuloMascotas
          titulo="Nueva mascota"
          subtitulo="Nombre, tipo y una foto bastan para empezar. Lo demás es opcional."
          ocultarBotonNueva
        />

        <div className="tarjeta-panel tarjeta-panel--form-ficha">
          <FormularioFichaMascota
            modo="crear"
            contactoPerfil={contactoPerfil ?? undefined}
          />
        </div>

        <p className="auth-enlace form-ficha-volver">
          <Link href="/mis-mascotas" className="pp-enlace-icono">
            <Icono nombre="izquierda" size={14} />
            Mis mascotas
          </Link>
        </p>
      </div>
    </EnvolturaPaginasApp>
  );
}
