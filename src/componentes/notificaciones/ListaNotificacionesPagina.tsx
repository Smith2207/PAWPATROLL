"use client";



/**
 * [notificaciones] Componente React: lista notificaciones pagina.
 */
import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  contarNotificacionesNoLeidas,
  listarNotificacionesUsuario,
  marcarNotificacionLeida,
  marcarTodasNotificacionesLeidas,
  type NotificacionAgrupada,
} from "@/actions/notificaciones";
import { Icono } from "@/componentes/ui/Icono";
import { IconoNotificacion } from "@/componentes/notificaciones/utilidades-notificacion";
import { useTiempoReal } from "@/hooks/useTiempoReal";
import { tiempoRelativo } from "@/lib/fechas/tiempo-relativo";

export function ListaNotificacionesPagina() {
  const { data: sesion, status } = useSession();
  const [lista, setLista] = useState<NotificacionAgrupada[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [pendiente, iniciar] = useTransition();

  const recargar = useCallback(async () => {
    const [items, n] = await Promise.all([
      listarNotificacionesUsuario(100),
      contarNotificacionesNoLeidas(),
    ]);
    setLista(items);
    setNoLeidas(n);
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelado = false;
    void (async () => {
      const [items, n] = await Promise.all([
        listarNotificacionesUsuario(100),
        contarNotificacionesNoLeidas(),
      ]);
      if (!cancelado) {
        setLista(items);
        setNoLeidas(n);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [status]);

  const userId = sesion?.user?.id;
  useTiempoReal(userId ? [`usuario:${userId}`] : [], (ev) => {
    if (ev.tipo === "notificacion:nueva") void recargar();
  });

  if (status === "loading") {
    return <p className="pp-notif-vacio">Cargando…</p>;
  }

  if (status !== "authenticated") {
    return (
      <p className="pp-notif-vacio">
        <Link href="/?login=1">Inicia sesión</Link> para ver tus notificaciones.
      </p>
    );
  }

  function irNotificacion(n: NotificacionAgrupada) {
    iniciar(async () => {
      await marcarNotificacionLeida(n.id);
      void recargar();
    });
  }

  return (
    <div className="pp-notif-pagina">
      <header className="pp-notif-pagina-header">
        <h1>Notificaciones</h1>
        {noLeidas > 0 && (
          <button
            type="button"
            className="pp-notif-marcar-todas"
            disabled={pendiente}
            onClick={() =>
              iniciar(async () => {
                await marcarTodasNotificacionesLeidas();
                void recargar();
              })
            }
          >
            Marcar todas como leídas
          </button>
        )}
      </header>

      {lista.length === 0 ? (
        <p className="pp-notif-vacio">No tienes notificaciones.</p>
      ) : (
        <ul className="pp-notif-lista pp-notif-lista--pagina">
          {lista.map((n) => (
            <li key={n.id}>
              {n.enlace ? (
                <Link
                  href={n.enlace}
                  className={`pp-notif-item ${!n.leida ? "pp-notif-item--nueva" : ""} ${n.prioridad === "ALTA" ? "pp-notif-item--alta" : ""}`}
                  onClick={() => irNotificacion(n)}
                >
                  <span className="pp-notif-item-icono" aria-hidden>
                    <IconoNotificacion tipo={n.tipo} size={20} />
                  </span>
                  <span className="pp-notif-item-cuerpo">
                    <strong>{n.titulo}</strong>
                    {n.cuerpo && <span>{n.cuerpo}</span>}
                    <time>{tiempoRelativo(n.createdAt, "notificacion")}</time>
                  </span>
                </Link>
              ) : (
                <div
                  className={`pp-notif-item ${!n.leida ? "pp-notif-item--nueva" : ""}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => irNotificacion(n)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") irNotificacion(n);
                  }}
                >
                  <span className="pp-notif-item-icono"><IconoNotificacion tipo={n.tipo} size={20} /></span>
                  <span className="pp-notif-item-cuerpo">
                    <strong>{n.titulo}</strong>
                    {n.cuerpo && <span>{n.cuerpo}</span>}
                    <time>{tiempoRelativo(n.createdAt, "notificacion")}</time>
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
