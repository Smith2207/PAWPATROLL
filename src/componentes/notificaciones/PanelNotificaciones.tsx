"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  marcarNotificacionLeida,
  type NotificacionAgrupada,
} from "@/actions/notificaciones";

type Props = {
  inicial: NotificacionAgrupada[];
};

function iconoTipo(tipo: string) {
  if (tipo.includes("AVISTAMIENTO")) return "👁️";
  if (tipo === "MENSAJE_NUEVO") return "💬";
  if (tipo === "COINCIDENCIA_IA") return "📷";
  if (tipo === "CASO_RECUPERADO") return "🎉";
  return "🔔";
}

export function PanelNotificaciones({ inicial }: Props) {
  const router = useRouter();

  if (inicial.length === 0) {
    return (
      <div className="pp-notif-pagina-vacio">
        <span aria-hidden>🔔</span>
        <p>No tienes notificaciones por ahora.</p>
        <p className="pp-notif-pagina-vacio-sub">
          Te avisaremos cuando haya avistamientos, mensajes o coincidencias
          relacionadas con tus mascotas o reportes.
        </p>
      </div>
    );
  }

  return (
    <ul className="pp-notif-pagina-lista">
      {inicial.map((n) => (
        <li
          key={n.id}
          className={`pp-notif-pagina-item ${!n.leida ? "pp-notif-pagina-item--nueva" : ""} ${n.prioridad === "ALTA" ? "pp-notif-pagina-item--alta" : ""}`}
        >
          <span className="pp-notif-pagina-icono" aria-hidden>
            {iconoTipo(n.tipo)}
          </span>
          <div className="pp-notif-pagina-cuerpo">
            <strong>{n.titulo}</strong>
            {n.cuerpo && <p>{n.cuerpo}</p>}
            <time>
              {new Date(n.createdAt).toLocaleString("es-PE", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </time>
          </div>
          {n.enlace && (
            <Link
              href={n.enlace}
              className="pp-notif-pagina-link"
              onClick={async () => {
                await marcarNotificacionLeida(n.id);
                router.refresh();
              }}
            >
              Abrir
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}
