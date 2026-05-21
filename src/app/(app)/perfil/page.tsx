import { auth } from "@/auth";
import { BotonSalirSesion } from "@/componentes/auth/BotonSalirSesion";
import { FormularioPerfil } from "@/componentes/auth/FormularioPerfil";
import { etiquetaRol } from "@/lib/auth/roles";
import Link from "next/link";
import { redirect } from "next/navigation";
export default async function PaginaPerfil() {
  const sesion = await auth();
  if (!sesion?.user) redirect("/");

  const { user } = sesion;

  return (
    <div className="panel-cuenta">
      <div className="panel-cuenta-header">
        {user.image ? (
          <img
            src={user.image}
            alt=""
            width={64}
            height={64}
            className="avatar-perfil"
          />
        ) : (
          <div className="avatar-perfil avatar-perfil--placeholder">👤</div>
        )}
        <div style={{ flex: 1 }}>
          <h1 style={{ marginBottom: 4 }}>{user.name ?? "Usuario"}</h1>
          <p className="panel-cuenta-subtitulo">{user.email}</p>
          <span className="badge-rol">{etiquetaRol(user.rol)}</span>
        </div>
        <BotonSalirSesion />
      </div>

      <div className="panel-cuenta-grid">
        <div className="tarjeta-panel">
          <h2>Datos personales</h2>
          <FormularioPerfil nombreInicial={user.name ?? ""} />
        </div>
        <div className="tarjeta-panel">
          <h2>Accesos rápidos</h2>
          <ul style={{ listStyle: "none", fontWeight: 700, lineHeight: 2 }}>
            <li>
              <Link href="/mis-mascotas">🐾 Mis fichas</Link>
            </li>
            <li>
              <Link href="/">🏠 Volver al inicio</Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
