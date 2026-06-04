import { obtenerDatosPerfil } from "@/actions/autenticacion";
import { listarMisMascotas } from "@/actions/mascotas";
import { EditorFotoPerfil } from "@/componentes/auth/EditorFotoPerfil";
import { FormularioPerfil } from "@/componentes/auth/FormularioPerfil";
import { ResumenCasosDueno } from "@/componentes/mascotas/ResumenCasosDueno";
import { Icono } from "@/componentes/ui/Icono";
import { etiquetaRol } from "@/lib/auth/roles";
import Link from "next/link";
import { redirect } from "next/navigation";

function inicialUsuario(nombre: string | null, correo: string) {
  const base = (nombre ?? correo).trim();
  return base.charAt(0).toUpperCase();
}

export default async function PaginaPerfil() {
  const perfil = await obtenerDatosPerfil();
  if (!perfil) redirect("/");

  const mascotas = perfil.mascotasPerdidas > 0 ? await listarMisMascotas() : [];

  const iniciales = inicialUsuario(perfil.nombre, perfil.email);
  const nombreVisible = perfil.nombre?.trim() || "Usuario";

  return (
    <div className="panel-cuenta perfil-pagina">
      <div className="perfil-layout">
        <div className="perfil-layout-main">
          <section className="perfil-hero">
            <div className="perfil-hero-identidad">
              <EditorFotoPerfil
                imagenInicial={perfil.imagen}
                iniciales={iniciales}
                nombre={nombreVisible}
              />
              <div className="perfil-hero-texto">
                <p className="perfil-hero-etiqueta">Mi cuenta</p>
                <h1>{nombreVisible}</h1>
                <p className="perfil-hero-correo">{perfil.email}</p>
              </div>
            </div>
            <div className="perfil-hero-lateral">
              <div className="perfil-hero-badges">
                <span className="badge-rol">{etiquetaRol(perfil.rol)}</span>
                {perfil.emailVerificado ? (
                  <span className="perfil-badge perfil-badge--ok">
                    <Icono nombre="checkCirculo" size={14} className="pp-icon--btn" />
                    Correo verificado
                  </span>
                ) : (
                  <span className="perfil-badge perfil-badge--pendiente">
                    Correo pendiente
                  </span>
                )}
              </div>
              <div className="perfil-hero-acciones">
                <Link
                  href="/mis-mascotas/ficha"
                  className="perfil-btn-accion perfil-btn-accion--primario"
                >
                  Nueva mascota
                </Link>
                <Link href="/mis-mascotas" className="perfil-btn-accion">
                  Mis mascotas
                  {perfil.totalMascotas > 0 && (
                    <span className="perfil-btn-accion-contador">
                      {perfil.totalMascotas}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </section>

          <section className="tarjeta-panel perfil-tarjeta">
            <h2>Datos personales</h2>
            <p className="perfil-tarjeta-desc">
              Mantén tu información al día para que la comunidad pueda contactarte
              si hace falta.
            </p>
            <FormularioPerfil
              nombreInicial={perfil.nombre ?? ""}
              telefonoInicial={perfil.telefono ?? ""}
              ciudadInicial={perfil.ciudad ?? ""}
              email={perfil.email}
              notificacionesEmailInicial={perfil.notificacionesEmail}
              notificacionesInAppInicial={perfil.notificacionesInApp}
            />
            {!perfil.emailVerificado && (
              <div className="perfil-cuenta-acciones">
                <Link href="/verificar-correo" className="perfil-enlace">
                  Verificar correo
                </Link>
              </div>
            )}
          </section>

          {perfil.tieneContrasena && (
            <section className="tarjeta-panel perfil-tarjeta perfil-tarjeta--seguridad-cta">
              <div className="perfil-seguridad-cta perfil-seguridad-cta--fila">
                <div className="perfil-seguridad-cta-cuerpo">
                  <span className="perfil-seguridad-cta-icono" aria-hidden>
                    <Icono nombre="candado" size={22} />
                  </span>
                  <p className="perfil-seguridad-cta-desc">
                    Cambia tu contraseña de vez en cuando para mantener tu cuenta
                    segura.
                  </p>
                </div>
                <Link
                  href="/perfil/cambiar-contrasena"
                  className="perfil-btn-seguridad perfil-btn-seguridad--compacto pp-enlace-icono"
                >
                  Cambiar contraseña
                  <Icono nombre="derecha" size={14} />
                </Link>
              </div>
            </section>
          )}
        </div>

        <aside className="perfil-layout-lateral">
          {perfil.mascotasPerdidas > 0 && (
            <ResumenCasosDueno mascotas={mascotas} />
          )}

          <section className="tarjeta-panel perfil-tarjeta perfil-resumen">
            <h2 className="perfil-resumen-titulo">Tus mascotas</h2>
            <ul className="perfil-stats">
              <li className="perfil-stat">
                <span className="perfil-stat-label">Registradas</span>
                <span className="perfil-stat-num">{perfil.totalMascotas}</span>
              </li>
              <li className="perfil-stat">
                <span className="perfil-stat-label">Perdidas</span>
                <span className="perfil-stat-num perfil-stat-num--alerta">
                  {perfil.mascotasPerdidas}
                </span>
              </li>
              <li className="perfil-stat">
                <span className="perfil-stat-label">En casa</span>
                <span className="perfil-stat-num">{perfil.mascotasEnCasa}</span>
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
