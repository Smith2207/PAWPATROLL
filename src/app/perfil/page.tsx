import { auth } from "@/auth";
import { FormularioPerfil } from "@/componentes/auth/FormularioPerfil";
import { etiquetaRol } from "@/lib/auth/roles";
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        {user.image ? (
          <img
            src={user.image}
            alt=""
            width={64}
            height={64}
            style={{ borderRadius: "50%", border: "2px solid var(--border)" }}
          />
        ) : (
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "var(--blue-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.75rem",
            }}
          >
            👤
          </div>
        )}
        <div>
          <h1 style={{ marginBottom: 4 }}>{user.name ?? "Usuario"}</h1>
          <p style={{ color: "var(--muted)", fontWeight: 600, margin: 0 }}>
            {user.email}
          </p>
          <span className="badge-rol">{etiquetaRol(user.rol)}</span>
        </div>
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
