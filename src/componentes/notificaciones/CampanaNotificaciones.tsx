"use client";

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
import { useTiempoReal } from "@/hooks/useTiempoReal";

function iconoTipo(tipo: string) {
  if (tipo.includes("AVISTAMIENTO")) return "👁️";
  if (tipo === "MENSAJE_NUEVO") return "💬";
  if (tipo === "COINCIDENCIA_IA") return "📷";
  if (tipo === "CASO_RECUPERADO") return "🎉";
  if (tipo === "REPORTE_ABUSO_ADMIN") return "⚠️";
  return "🔔";
}

function tiempoRelativo(fecha: Date) {
  const diff = Date.now() - new Date(fecha).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  return new Date(fecha).toLocaleDateString("es-PE");
}

export function CampanaNotificaciones() {
  const { data: sesion, status } = useSession();
  const [abierto, setAbierto] = useState(false);
  const [lista, setLista] = useState<NotificacionAgrupada[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [pendiente, iniciar] = useTransition();

  const recargar = useCallback(async () => {
    const [items, n] = await Promise.all([
      listarNotificacionesUsuario(12),
      contarNotificacionesNoLeidas(),
    ]);
    setLista(items);
    setNoLeidas(n);
  }, []);

  useEffect(() => {
    if (status === "authenticated") void recargar();
  }, [status, recargar]);

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
        🔔
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
                          {iconoTipo(n.tipo)}
                        </span>
                        <span className="pp-notif-item-cuerpo">
                          <strong>{n.titulo}</strong>
                          {n.cuerpo && <span>{n.cuerpo}</span>}
                          <time>{tiempoRelativo(n.createdAt)}</time>
                        </span>
                      </Link>
                    ) : (
                      <div className="pp-notif-item">
                        <span className="pp-notif-item-icono">{iconoTipo(n.tipo)}</span>
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

            <Link
              href="/notificaciones"
              className="pp-notif-ver-todas"
              onClick={() => setAbierto(false)}
            >
              Ver todas →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
