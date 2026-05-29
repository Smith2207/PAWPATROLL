"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  gestionarEstadoAvistamiento,
  enviarMensajeAvistamiento,
  listarAvistamientosPorMascota,
  type AvistamientoConMensajes,
} from "@/actions/avistamientos";
import type { PrediccionComportamiento } from "@/lib/comportamiento/prediccion";
import { PanelComportamiento } from "@/componentes/comportamiento/PanelComportamiento";
import { useRespaldoActualizacion } from "@/hooks/useRespaldoActualizacion";
import { useTiempoReal } from "@/hooks/useTiempoReal";

type Props = {
  mascotaId: string;
  nombreMascota: string;
  avistamientosIniciales: AvistamientoConMensajes[];
  esDueno: boolean;
  prediccion: PrediccionComportamiento | null;
};

function etiquetaEstado(estado: string) {
  if (estado === "VERIFICADO") return "✓ Verificado";
  if (estado === "DESCARTADO") return "✗ Descartado";
  return "⏳ Pendiente";
}

function ChatAvistamiento({
  av,
  esDueno,
  nombreMascota,
}: {
  av: AvistamientoConMensajes;
  esDueno: boolean;
  nombreMascota: string;
}) {
  const [texto, setTexto] = useState("");
  const [nombreInvitado, setNombreInvitado] = useState(av.nombreReportante ?? "");
  const [pendiente, iniciar] = useTransition();
  const router = useRouter();

  const enviar = () => {
    iniciar(async () => {
      const res = await enviarMensajeAvistamiento(
        av.id,
        texto,
        esDueno ? undefined : nombreInvitado || undefined
      );
      if (res.ok) {
        setTexto("");
        router.refresh();
      } else {
        alert(res.error ?? "No se pudo enviar.");
      }
    });
  };

  return (
    <div className="chat-avistamiento">
      <h4 className="chat-avistamiento-titulo">💬 Chat con el dueño</h4>
      <ul className="chat-avistamiento-mensajes">
        {av.mensajes.length === 0 && (
          <li className="chat-avistamiento-vacio">Sin mensajes aún.</li>
        )}
        {av.mensajes.map((m) => (
          <li key={m.id} className="chat-avistamiento-msg">
            <strong>{m.autorNombre ?? "Usuario"}</strong>
            <p>{m.contenido}</p>
            <time>
              {new Date(m.createdAt).toLocaleString("es-PE", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </time>
          </li>
        ))}
      </ul>
      {!esDueno && !av.userId && (
        <label className="chat-avistamiento-nombre">
          Tu nombre
          <input
            type="text"
            value={nombreInvitado}
            onChange={(e) => setNombreInvitado(e.target.value)}
            placeholder="Para que te reconozcan"
          />
        </label>
      )}
      <div className="chat-avistamiento-form">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={`Escribe sobre ${nombreMascota}…`}
          rows={2}
          maxLength={2000}
        />
        <button type="button" disabled={pendiente || !texto.trim()} onClick={enviar}>
          {pendiente ? "Enviando…" : "Enviar"}
        </button>
      </div>
    </div>
  );
}

export function SeccionAvistamientosMascota({
  mascotaId,
  nombreMascota,
  avistamientosIniciales,
  esDueno,
  prediccion,
}: Props) {
  const router = useRouter();
  const [lista, setLista] = useState(avistamientosIniciales);
  const [pendiente, iniciar] = useTransition();

  const recargar = useCallback(async () => {
    const nueva = await listarAvistamientosPorMascota(mascotaId, {
      dueno: esDueno,
      incluirDescartados: esDueno,
    });
    setLista(nueva);
    router.refresh();
  }, [mascotaId, esDueno, router]);

  const { conectado: wsConectado } = useTiempoReal([`mascota:${mascotaId}`], (evento) => {
    if (
      evento.tipo === "mensaje:nuevo" &&
      evento.mascotaId === mascotaId
    ) {
      void recargar();
      return;
    }
    if (
      (evento.tipo === "avistamiento:nuevo" ||
        evento.tipo === "avistamiento:actualizado") &&
      evento.mascotaId === mascotaId
    ) {
      void recargar();
    }
  });

  useRespaldoActualizacion(() => {
    void recargar();
  }, wsConectado);

  const gestionar = (id: string, estado: "VERIFICADO" | "DESCARTADO") => {
    const motivo =
      estado === "DESCARTADO"
        ? window.prompt("Motivo del descarte (opcional)") ?? undefined
        : undefined;
    iniciar(async () => {
      const res = await gestionarEstadoAvistamiento(id, estado, motivo);
      if (res.ok) void recargar();
      else alert(res.error ?? "Error");
    });
  };

  return (
    <section
      id="avistamientos"
      className="seccion-avistamientos"
      aria-labelledby="avistamientos-titulo"
    >
      {prediccion && (
        <PanelComportamiento prediccion={prediccion} nombreMascota={nombreMascota} />
      )}

      <h2 id="avistamientos-titulo" className="ficha-publica-seccion-titulo">
        👁️ Avistamientos de {nombreMascota}
      </h2>
      <p className="seccion-avistamientos-intro">
        Solo reportes vinculados a esta mascota. El mapa de arriba muestra la misma
        información en el espacio.
      </p>

      {lista.length === 0 ? (
        <p className="seccion-avistamientos-vacio">
          Aún no hay avistamientos. Sé el primero en reportar si ves a {nombreMascota}.
        </p>
      ) : (
        <ol className="timeline-avistamientos">
          {lista.map((av) => (
            <li key={av.id} className={`timeline-avistamiento timeline-avistamiento--${av.estado.toLowerCase()}`}>
              <div className="timeline-avistamiento-cabecera">
                <span className="timeline-avistamiento-num">#{av.numeroReporte}</span>
                <span className="timeline-avistamiento-estado">{etiquetaEstado(av.estado)}</span>
                <time>
                  {new Date(av.createdAt).toLocaleString("es-PE", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </time>
              </div>

              {av.direccion && (
                <p className="timeline-avistamiento-lugar">📍 {av.direccion}</p>
              )}
              {av.descripcion && <p>{av.descripcion}</p>}
              {av.nombreReportante && (
                <p className="timeline-avistamiento-reportante">
                  Reportó: <strong>{av.nombreReportante}</strong>
                  {av.telefonoReportante ? ` · ${av.telefonoReportante}` : ""}
                </p>
              )}
              {av.fotoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={av.fotoUrl}
                  alt={`Foto avistamiento ${av.numeroReporte}`}
                  className="timeline-avistamiento-foto"
                />
              )}

              {esDueno && av.estado === "PENDIENTE" && (
                <div className="timeline-avistamiento-acciones">
                  <button
                    type="button"
                    disabled={pendiente}
                    onClick={() => gestionar(av.id, "VERIFICADO")}
                  >
                    Verificar
                  </button>
                  <button
                    type="button"
                    className="timeline-btn-descartar"
                    disabled={pendiente}
                    onClick={() => gestionar(av.id, "DESCARTADO")}
                  >
                    Descartar
                  </button>
                </div>
              )}

              <ChatAvistamiento av={av} esDueno={esDueno} nombreMascota={nombreMascota} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
