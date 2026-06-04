import { auth } from "@/auth";
import { listarHubChats } from "@/actions/casos";
import { EnvolturaPaginasApp } from "@/componentes/layout/EnvolturaPaginasApp";
import { Icono, iconoPorTipoMascota } from "@/componentes/ui/Icono";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mensajes — PawPatroll",
  description: "Conversaciones de coordinación de tus mascotas en búsqueda.",
};

export default async function PaginaChats() {
  const sesion = await auth();
  if (!sesion?.user) redirect("/");

  const { casosDueno } = await listarHubChats();

  return (
    <EnvolturaPaginasApp>
      <div className="panel-cuenta panel-cuenta--chats">
        <header className="mascotas-lista-cabecera">
          <div>
            <h1>Mensajes</h1>
            <p className="mascotas-lista-resumen">
              Coordinación con testigos de tus mascotas perdidas.
            </p>
          </div>
        </header>

        {casosDueno.length === 0 ? (
          <div className="mascotas-vacio tarjeta-panel">
            <span className="mascotas-vacio-icono" aria-hidden>
              <Icono nombre="mensaje" size={40} />
            </span>
            <h2>Sin mensajes activos</h2>
            <p>
              Cuando tengas una mascota marcada como perdida, aquí verás el
              centro de coordinación de cada caso.
            </p>
            <Link href="/mis-mascotas" className="btn-mascota btn-mascota--primario">
              Ir a mis mascotas
            </Link>
          </div>
        ) : (
          <section className="mascotas-casos-resumen" aria-labelledby="chats-dueno-titulo">
            <header className="mascotas-casos-resumen-cabecera">
              <h2 id="chats-dueno-titulo">Mascotas en búsqueda</h2>
            </header>
            <ul className="mascotas-casos-resumen-lista">
              {casosDueno.map((c) => (
                <li key={c.mascotaId}>
                  <Link href={c.enlace} className="acceso-caso acceso-caso--enlace">
                    <span className="acceso-caso-avatar">
                      {c.fotoPrincipal ? (
                        <img
                          src={c.fotoPrincipal}
                          alt=""
                          className="acceso-caso-avatar-img"
                          width={48}
                          height={48}
                        />
                      ) : (
                        <span className="acceso-caso-avatar-placeholder" aria-hidden>
                          <Icono nombre={iconoPorTipoMascota(c.tipo)} size={24} />
                        </span>
                      )}
                    </span>
                    <span className="acceso-caso-texto">
                      <span className="acceso-caso-nombre">
                        Mensajes de {c.nombreMascota}
                      </span>
                      <span className="acceso-caso-preview">
                        {c.totalAvistamientos === 0
                          ? "Sin avistamientos aún"
                          : `${c.totalAvistamientos} avistamiento${c.totalAvistamientos === 1 ? "" : "s"}`}
                      </span>
                    </span>
                    <Icono nombre="derecha" size={18} className="acceso-caso-flecha" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </EnvolturaPaginasApp>
  );
}
