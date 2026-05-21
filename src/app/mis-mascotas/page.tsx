import { auth } from "@/auth";
import { listarMisMascotas } from "@/actions/mascotas";
import { FormularioNuevaMascota } from "@/componentes/auth/FormularioNuevaMascota";
import { BotonEliminarMascota } from "@/componentes/auth/BotonEliminarMascota";
import { puedeRegistrarMascotas } from "@/lib/auth/roles";
import Link from "next/link";
import { redirect } from "next/navigation";
import "@/estilos/auth.css";
import "@/estilos/landing-pawpatrol.css";

export default async function PaginaMisMascotas() {
  const sesion = await auth();
  if (!sesion?.user) redirect("/iniciar-sesion");

  const mascotas = await listarMisMascotas();
  const puedeCrear = puedeRegistrarMascotas(sesion.user.rol);

  return (
    <div className="panel-cuenta">
      <h1>Mis mascotas</h1>
      <p style={{ color: "var(--muted)", fontWeight: 600, marginBottom: "1rem" }}>
        Gestiona el perfil de tus mascotas registradas en PawPatrol.
      </p>

      {!puedeCrear && (
        <p className="auth-alerta auth-alerta--error">
          Tu rol actual ({sesion.user.rol}) no permite registrar mascotas. Regístrate
          como <strong>Dueño</strong> o contacta a un administrador.
        </p>
      )}

      <div className="panel-cuenta-grid">
        <div className="tarjeta-panel">
          <h2>Mascotas registradas ({mascotas.length})</h2>
          {mascotas.length === 0 ? (
            <p style={{ color: "var(--muted)", fontWeight: 600 }}>
              Aún no tienes mascotas registradas.
            </p>
          ) : (
            <ul className="lista-mascotas">
              {mascotas.map((m) => (
                <li key={m.id} className="item-mascota">
                  <div>
                    <strong>{m.nombre}</strong>
                    <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                      {m.tipo}
                      {m.raza ? ` · ${m.raza}` : ""}
                    </div>
                  </div>
                  <BotonEliminarMascota id={m.id} />
                </li>
              ))}
            </ul>
          )}
        </div>

        {puedeCrear && (
          <div className="tarjeta-panel">
            <h2>Registrar nueva mascota</h2>
            <FormularioNuevaMascota />
          </div>
        )}
      </div>

      <p className="auth-enlace" style={{ marginTop: "2rem" }}>
        <Link href="/perfil">← Mi perfil</Link>
      </p>
    </div>
  );
}
