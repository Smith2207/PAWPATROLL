import {
  listarAvistamientosAdmin,
  obtenerEstadisticasAdmin,
} from "@/actions/admin";
import { EnvolturaPaginasApp } from "@/componentes/layout/EnvolturaPaginasApp";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PaginaAdmin() {
  const [stats, recientes] = await Promise.all([
    obtenerEstadisticasAdmin(),
    listarAvistamientosAdmin(20),
  ]);

  return (
    <EnvolturaPaginasApp>
      <div className="admin-panel">
        <header className="admin-panel-cabecera">
          <div>
            <h1>🛡️ Panel administrativo</h1>
            <p>Módulo M7 — supervisión de PawPatrol</p>
          </div>
          <Link href="/" className="admin-panel-volver">
            ← Inicio
          </Link>
        </header>

        <div className="admin-stats-grid">
          <article className="admin-stat">
            <span className="admin-stat-valor">{stats.usuarios}</span>
            <span className="admin-stat-etiq">Usuarios</span>
          </article>
          <article className="admin-stat">
            <span className="admin-stat-valor">{stats.mascotas}</span>
            <span className="admin-stat-etiq">Mascotas</span>
          </article>
          <article className="admin-stat admin-stat--alerta">
            <span className="admin-stat-valor">{stats.perdidas}</span>
            <span className="admin-stat-etiq">Perdidas activas</span>
          </article>
          <article className="admin-stat admin-stat--ok">
            <span className="admin-stat-valor">{stats.reunidas}</span>
            <span className="admin-stat-etiq">Reunidas</span>
          </article>
          <article className="admin-stat">
            <span className="admin-stat-valor">{stats.avistamientos}</span>
            <span className="admin-stat-etiq">Avistamientos</span>
          </article>
          <article className="admin-stat">
            <span className="admin-stat-valor">{stats.avistamientosPendientes}</span>
            <span className="admin-stat-etiq">Pendientes</span>
          </article>
        </div>

        <section className="admin-seccion">
          <h2>Exportar datos</h2>
          <a href="/api/admin/export" className="admin-btn-export">
            📥 Descargar avistamientos (CSV)
          </a>
        </section>

        <section className="admin-seccion">
          <h2>Avistamientos recientes</h2>
          <div className="admin-tabla-wrap">
            <table className="admin-tabla">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Mascota</th>
                  <th>Estado</th>
                  <th>Lugar</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {recientes.map((r) => (
                  <tr key={r.id}>
                    <td>{r.numeroReporte}</td>
                    <td>
                      {r.slug ? (
                        <Link href={`/mascota/${r.slug}`}>{r.nombreMascota}</Link>
                      ) : (
                        r.nombreMascota ?? "—"
                      )}
                    </td>
                    <td>{r.estado}</td>
                    <td>{r.direccion ?? "—"}</td>
                    <td>
                      {new Date(r.createdAt).toLocaleString("es-PE", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </EnvolturaPaginasApp>
  );
}
