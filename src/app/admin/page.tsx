import {
  listarAvistamientosAdmin,
  listarReportesAbusoAdmin,
  listarUsuariosAdmin,
  obtenerDatosMapaAdmin,
  obtenerEstadisticasAdmin,
  obtenerMetricasAdmin,
} from "@/actions/admin";
import { MapaAdminPanel } from "@/componentes/admin/MapaAdminPanel";
import { ModeracionReportes } from "@/componentes/admin/ModeracionReportes";
import { TablaUsuariosAdmin } from "@/componentes/admin/TablaUsuariosAdmin";
import { EnvolturaPaginasApp } from "@/componentes/layout/EnvolturaPaginasApp";
import { Icono, type NombreIcono } from "@/componentes/ui/Icono";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Kpi = {
  valor: number;
  etiqueta: string;
  icono: NombreIcono;
  tono: "default" | "alerta" | "ok" | "info" | "warn";
};

function TarjetaSeccion({
  titulo,
  icono,
  desc,
  badge,
  children,
  id,
}: {
  titulo: string;
  icono: NombreIcono;
  desc?: string;
  badge?: string | number;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <article className="admin-card" id={id}>
      <header className="admin-card-header">
        <div className="admin-card-header-izq">
          <span className="admin-card-icono" aria-hidden>
            <Icono nombre={icono} size={18} />
          </span>
          <div>
            <h2>{titulo}</h2>
            {desc ? <p>{desc}</p> : null}
          </div>
        </div>
        {badge != null && badge !== 0 ? (
          <span className="admin-card-badge">{badge}</span>
        ) : null}
      </header>
      <div className="admin-card-body">{children}</div>
    </article>
  );
}

function badgeEstadoAvistamiento(estado: string) {
  if (estado === "VERIFICADO") return "admin-pill admin-pill--ok";
  if (estado === "DESCARTADO") return "admin-pill admin-pill--muted";
  return "admin-pill admin-pill--warn";
}

function iniciales(nombre: string | null, email: string) {
  const base = (nombre ?? email).trim();
  return base.charAt(0).toUpperCase();
}

export default async function PaginaAdmin() {
  const [stats, metricas, mapa, recientes, reportes, usuarios] = await Promise.all([
    obtenerEstadisticasAdmin(),
    obtenerMetricasAdmin(),
    obtenerDatosMapaAdmin(),
    listarAvistamientosAdmin(20),
    listarReportesAbusoAdmin(15),
    listarUsuariosAdmin("", 40),
  ]);

  const reportesPendientes = reportes.filter((r) => r.estado === "PENDIENTE").length;

  const kpis: Kpi[] = [
    { valor: stats.usuarios, etiqueta: "Usuarios", icono: "personas", tono: "info" },
    { valor: stats.mascotas, etiqueta: "Mascotas", icono: "huella", tono: "default" },
    { valor: stats.perdidas, etiqueta: "Perdidas activas", icono: "alerta", tono: "alerta" },
    { valor: stats.reunidas, etiqueta: "Reunidas", icono: "checkCirculo", tono: "ok" },
    { valor: stats.avistamientos, etiqueta: "Avistamientos", icono: "ubicacion", tono: "default" },
    {
      valor: stats.avistamientosPendientes,
      etiqueta: "Por revisar",
      icono: "reloj",
      tono: "warn",
    },
  ];

  const exportaciones = [
    { tipo: "avistamientos", titulo: "Avistamientos", desc: "Coordenadas y estados" },
    { tipo: "usuarios", titulo: "Usuarios", desc: "Roles y estado de cuenta" },
    { tipo: "mascotas-perdidas", titulo: "Mascotas perdidas", desc: "Casos activos" },
    { tipo: "reportes", titulo: "Reportes de abuso", desc: "Cola de moderación" },
  ] as const;

  const mesActual = new Date().toLocaleDateString("es-PE", {
    month: "long",
    year: "numeric",
  });

  return (
    <EnvolturaPaginasApp>
      <div className="admin-dashboard">
        <header className="admin-hero">
          <div className="admin-hero-inner">
            <div className="admin-hero-texto">
              
              <h1>
                <Icono nombre="escudo" size={28} className="pp-icon--btn" />
                Panel administrativo
              </h1>
              <p>Supervisión en tiempo real de PawPatrol · {mesActual}</p>
            </div>
            <Link href="/" className="admin-hero-volver pp-enlace-icono">
              <Icono nombre="izquierda" size={14} />
              Volver al inicio
            </Link>
          </div>
        </header>

        <div className="admin-contenido">
          <nav className="admin-nav-anclas" aria-label="Secciones del panel">
            <a href="#metricas">Métricas</a>
            <a href="#mapa">Mapa</a>
            <a href="#moderacion">Moderación</a>
            <a href="#usuarios">Usuarios</a>
            <a href="#actividad">Actividad</a>
          </nav>

          <section className="admin-kpi-grid" aria-label="Indicadores generales">
            {kpis.map((k) => (
              <article key={k.etiqueta} className={`admin-kpi admin-kpi--${k.tono}`}>
                <span className="admin-kpi-icono" aria-hidden>
                  <Icono nombre={k.icono} size={20} />
                </span>
                <div className="admin-kpi-datos">
                  <span className="admin-kpi-valor">{k.valor}</span>
                  <span className="admin-kpi-etiq">{k.etiqueta}</span>
                </div>
              </article>
            ))}
          </section>

          <div className="admin-layout">
            <div className="admin-layout-main">
              <TarjetaSeccion
                id="mapa"
                titulo="Mapa de calor"
                icono="mapa"
                desc="Densidad de avistamientos y pérdidas activas por zona."
              >
                <MapaAdminPanel datos={mapa} />
              </TarjetaSeccion>

              <TarjetaSeccion
                id="moderacion"
                titulo="Cola de moderación"
                icono="escudo"
                desc="Reportes de chats privados. Revisa solo lo necesario."
                badge={reportesPendientes > 0 ? reportesPendientes : undefined}
              >
                <ModeracionReportes reportes={reportes} />
              </TarjetaSeccion>

              <TarjetaSeccion
                id="usuarios"
                titulo="Gestión de usuarios"
                icono="personas"
                desc="Busca miembros y gestiona el estado de sus cuentas."
              >
                <TablaUsuariosAdmin usuariosIniciales={usuarios} />
              </TarjetaSeccion>

              <TarjetaSeccion
                id="actividad"
                titulo="Avistamientos recientes"
                icono="lista"
                desc="Últimos reportes registrados en la plataforma."
              >
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
                          <td className="admin-tabla-num">{r.numeroReporte}</td>
                          <td>
                            {r.slug ? (
                              <Link href={`/mascota/${r.slug}`} className="admin-tabla-link">
                                {r.nombreMascota}
                              </Link>
                            ) : (
                              r.nombreMascota ?? "—"
                            )}
                          </td>
                          <td>
                            <span className={badgeEstadoAvistamiento(r.estado)}>
                              {r.estado}
                            </span>
                          </td>
                          <td className="admin-tabla-trunc">{r.direccion ?? "—"}</td>
                          <td className="admin-tabla-fecha">
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
              </TarjetaSeccion>
            </div>

            <aside className="admin-layout-side">
              <TarjetaSeccion
                id="metricas"
                titulo="Métricas del mes"
                icono="estrella"
                desc="Rendimiento de reuniones y colaboración."
              >
                <div className="admin-metricas-inline">
                  <div className="admin-metrica-item">
                    <span className="admin-metrica-item-valor">{metricas.reunionesEsteMes}</span>
                    <span className="admin-metrica-item-etiq">Reuniones</span>
                  </div>
                  <div className="admin-metrica-item admin-metrica-item--destacada">
                    <span className="admin-metrica-item-valor">
                      {metricas.diasPromedioReunion != null
                        ? `${metricas.diasPromedioReunion}d`
                        : "—"}
                    </span>
                    <span className="admin-metrica-item-etiq">Tiempo medio</span>
                  </div>
                </div>

                {metricas.topColaboradores.length > 0 ? (
                  <div className="admin-ranking">
                    <h3>Top colaboradores</h3>
                    <ul className="admin-ranking-lista">
                      {metricas.topColaboradores.map((c, i) => (
                        <li key={c.userId}>
                          <span className="admin-ranking-pos">{i + 1}</span>
                          <span className="admin-ranking-avatar" aria-hidden>
                            {iniciales(c.nombre, c.email)}
                          </span>
                          <div className="admin-ranking-info">
                            <strong>{c.nombre ?? c.email.split("@")[0]}</strong>
                            <span>{c.total} avistamiento{c.total !== 1 ? "s" : ""}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="admin-vacio-inline">Aún no hay colaboradores destacados.</p>
                )}
              </TarjetaSeccion>

              <TarjetaSeccion titulo="Exportar datos" icono="descargar" desc="Descargas CSV para análisis.">
                <div className="admin-export-lista">
                  {exportaciones.map((e) => (
                    <a
                      key={e.tipo}
                      href={`/api/admin/export?tipo=${e.tipo}`}
                      className="admin-export-item pp-enlace-icono"
                    >
                      <span className="admin-export-item-icono" aria-hidden>
                        <Icono nombre="descargar" size={16} />
                      </span>
                      <span className="admin-export-item-texto">
                        <strong>{e.titulo}</strong>
                        <small>{e.desc}</small>
                      </span>
                      <Icono nombre="derecha" size={14} className="admin-export-item-flecha" />
                    </a>
                  ))}
                </div>
              </TarjetaSeccion>

              <div className="admin-resumen-side">
                <div className="admin-resumen-item">
                  <Icono nombre="checkCirculo" size={16} />
                  <span>
                    <strong>{stats.avistamientosVerificados}</strong> verificados
                  </span>
                </div>
                <div className="admin-resumen-item">
                  <Icono nombre="personas" size={16} />
                  <span>
                    <strong>{usuarios.filter((u) => u.activo).length}</strong> cuentas activas
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </EnvolturaPaginasApp>
  );
}
