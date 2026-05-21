import { auth } from "@/auth";
import { listarMisMascotas } from "@/actions/mascotas";
import { EncabezadoModuloMascotas } from "@/componentes/mascotas/EncabezadoModuloMascotas";
import { TarjetaMascotaLista } from "@/componentes/mascotas/TarjetaMascotaLista";
import Link from "next/link";
import { redirect } from "next/navigation";
import "@/estilos/auth.css";
import "@/estilos/mascotas.css";
import "@/estilos/landing-pawpatrol.css";

export default async function PaginaMisMascotas() {
  const sesion = await auth();
  if (!sesion?.user) redirect("/iniciar-sesion");

  const mascotas = await listarMisMascotas();

  return (
    <div className="panel-cuenta">
      <EncabezadoModuloMascotas
        titulo="🐾 Mis mascotas"
        subtitulo="Ficha digital, fotos, estados (en casa, perdida, encontrada, reunida) y ficha pública."
      />

      {mascotas.length === 0 ? (
        <div className="tarjeta-panel">
          <p style={{ color: "var(--muted)", fontWeight: 600 }}>
            Aún no tienes mascotas registradas. Crea la primera ficha con todos sus
            datos y fotos.
          </p>
          <Link
            href="/mis-mascotas/nueva"
            className="btn-mascota btn-mascota--primario"
            style={{ marginTop: "1rem", display: "inline-flex" }}
          >
            + Registrar mascota
          </Link>
        </div>
      ) : (
        <div className="mascotas-grid">
          {mascotas.map((m) => (
            <TarjetaMascotaLista key={m.id} mascota={m} />
          ))}
        </div>
      )}

      <p className="auth-enlace" style={{ marginTop: "2rem" }}>
        <Link href="/perfil">← Mi perfil</Link>
      </p>
    </div>
  );
}
