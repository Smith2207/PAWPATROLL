/**
 * Ruta /perfil/cambiar-contrasena. Página principal de la ruta.
 */
import { obtenerDatosPerfil } from "@/actions/autenticacion";
import { FormularioCambiarContrasena } from "@/componentes/auth/FormularioCambiarContrasena";
import { Icono } from "@/componentes/ui/Icono";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function PaginaCambiarContrasena() {
  const perfil = await obtenerDatosPerfil();
  if (!perfil) redirect("/");

  if (!perfil.tieneContrasena) {
    redirect("/perfil");
  }

  return (
    <div className="panel-cuenta perfil-pagina">
      <p className="perfil-volver">
        <Link href="/perfil" className="pp-enlace-icono">
          <Icono nombre="izquierda" size={14} />
          Mi perfil
        </Link>
      </p>

      <section className="tarjeta-panel perfil-tarjeta perfil-tarjeta--ancho">
        <h1>Cambiar contraseña</h1>
        <p className="perfil-tarjeta-desc">
          Actualiza tu contraseña sin salir de la cuenta. Solo para acceso con
          correo y contraseña (no aplica si entras solo con Google).
        </p>
        <FormularioCambiarContrasena email={perfil.email} />
      </section>
    </div>
  );
}
