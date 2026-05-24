import { auth } from "@/auth";
import { listarMisMascotas } from "@/actions/mascotas";
import { EncabezadoModuloMascotas } from "@/componentes/mascotas/EncabezadoModuloMascotas";
import { TarjetaMascotaLista } from "@/componentes/mascotas/TarjetaMascotaLista";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EnvolturaPaginasApp } from "@/componentes/layout/EnvolturaPaginasApp";

export default async function PaginaMisMascotas() {
  const sesion = await auth();
  if (!sesion?.user) redirect("/");

  const mascotas = await listarMisMascotas();

  return (
    <EnvolturaPaginasApp>
    <div className="panel-cuenta">
      <EncabezadoModuloMascotas
        titulo="🐾 Mis mascotas"
        subtitulo="Cada mascota tiene su ficha digital, fotos y estados (en casa, perdida, encontrada, reunida)."
      />

      {mascotas.length === 0 ? (
        <div className="tarjeta-panel">
          <p className="texto-vacio-modulo">
            Aún no tienes fichas. Crea la primera con nombre, tipo y al menos una foto.
          </p>
          <Link
            href="/mis-mascotas/ficha"
            className="btn-mascota btn-mascota--primario"
            style={{ marginTop: "1rem", display: "inline-flex" }}
          >
            + Crear ficha
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
    </EnvolturaPaginasApp>
  );
}
