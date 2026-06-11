"use client";



/**
 * [notificaciones] Componente React: campana notificaciones.
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

export function CampanaNotificaciones() {
  const { data: sesion, status } = useSession();
  const [abierto, setAbierto] = useState(false);
  const [lista, setLista] = useState<NotificacionAgrupada[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [pendiente, iniciar] = useTransition();

  const recargar = useCallback(async () => {
    const [items, n] = await Promise.all([
      listarNotificacionesUsuario(50),
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
        listarNotificacionesUsuario(50),
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

  if (status !== "authenticated") return null;

  function abrirPanel() {
    setAbierto((v) => !v);
    if (!abierto) void recargar();
  }

  function irNotificacion(n: NotificacionAgrupada) {
    iniciar(async () => {
      await marcarNotificacionLeida(n.id);
      void recargar();
    });
    setAbierto(false);
  }

  return (
    <div className="pp-notif-campana">
      <button
        type="button"
        className="pp-notif-campana-btn"
        aria-label={`Notificaciones${noLeidas ? `, ${noLeidas} sin leer` : ""}`}
        aria-expanded={abierto}
        onClick={abrirPanel}
      >
        <Icono nombre="campana" size={20} />
        {noLeidas > 0 && (
          <span className="pp-notif-badge">{noLeidas > 9 ? "9+" : noLeidas}</span>
        )}
      </button>

      {abierto && (
        <>
          <button
            type="button"
            className="pp-notif-overlay"
            aria-label="Cerrar notificaciones"
            onClick={() => setAbierto(false)}
          />
          <div className="pp-notif-panel" role="dialog" aria-label="Notificaciones">
            <div className="pp-notif-panel-header">
              <strong>Notificaciones</strong>
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
                  Marcar todas
                </button>
              )}
            </div>

            {lista.length === 0 ? (
              <p className="pp-notif-vacio">No tienes notificaciones nuevas.</p>
            ) : (
              <ul className="pp-notif-lista">
                {lista.map((n) => (
                  <li key={n.id}>
                    {n.enlace ? (
                      <Link
                        href={n.enlace}
                        className={`pp-notif-item ${!n.leida ? "pp-notif-item--nueva" : ""} ${n.prioridad === "ALTA" ? "pp-notif-item--alta" : ""}`}
                        onClick={() => irNotificacion(n)}
                      >
                        <span className="pp-notif-item-icono" aria-hidden>
                          <IconoNotificacion tipo={n.tipo} size={18} />
                        </span>
                        <span className="pp-notif-item-cuerpo">
                          <strong>{n.titulo}</strong>
                          {n.cuerpo && <span>{n.cuerpo}</span>}
                          <time>{tiempoRelativo(n.createdAt, "notificacion")}</time>
                        </span>
                      </Link>
                    ) : (
                      <div className="pp-notif-item">
                        <span className="pp-notif-item-icono"><IconoNotificacion tipo={n.tipo} size={18} /></span>
                        <span className="pp-notif-item-cuerpo">
                          <strong>{n.titulo}</strong>
                          {n.cuerpo && <span>{n.cuerpo}</span>}
                        </span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
