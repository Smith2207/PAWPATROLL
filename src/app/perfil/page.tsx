import { auth } from "@/auth";
import { FormularioPerfil } from "@/componentes/auth/FormularioPerfil";
import { ETIQUETAS_ROL } from "@/lib/auth/roles";
import Link from "next/link";
import { redirect } from "next/navigation";
import "@/estilos/auth.css";
import "@/estilos/landing-pawpatrol.css";

export default async function PaginaPerfil() {
  const sesion = await auth();
  if (!sesion?.user) redirect("/iniciar-sesion");

  const { user } = sesion;

  return (
    <div className="panel-cuenta">
      <h1>Mi perfil</h1>
      <p style={{ color: "var(--muted)", fontWeight: 600 }}>
        {user.email}
        <span className="badge-rol" style={{ marginLeft: 12 }}>
          {ETIQUETAS_ROL[user.rol]}
        </span>
      </p>

      <div className="panel-cuenta-grid">
        <div className="tarjeta-panel">
          <h2>Datos personales</h2>
          <FormularioPerfil nombreInicial={user.name ?? ""} />
        </div>
        <div className="tarjeta-panel">
          <h2>Accesos rápidos</h2>
          <ul style={{ listStyle: "none", fontWeight: 700, lineHeight: 2 }}>
            <li>
              <Link href="/mis-mascotas">🐾 Mis mascotas</Link>
            </li>
            <li>
              <Link href="/">🏠 Volver a la landing</Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
