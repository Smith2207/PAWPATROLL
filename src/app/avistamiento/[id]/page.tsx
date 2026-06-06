import { auth } from "@/auth";
import { obtenerChatPrivadoAvistamiento } from "@/actions/casos";
import { ChatPrivadoCaso } from "@/componentes/casos/ChatPrivadoCaso";
import { EtiquetaRolParticipante } from "@/componentes/casos/EtiquetaRolParticipante";
import { EnvolturaPaginasApp } from "@/componentes/layout/EnvolturaPaginasApp";
import { resolverConversacionAvistamiento } from "@/lib/chat/conversacion";
import { rolParticipante } from "@/lib/chat/roles";
import type { EventoCasoTimeline } from "@/lib/chat/timeline";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: "Coordinación — PawPatrol",
};

export default async function PaginaChatAvistamiento({ params }: Props) {
  const sesion = await auth();
  if (!sesion?.user) redirect("/");

  const { id } = await params;
  const chat = await obtenerChatPrivadoAvistamiento(id);
  if (!chat) notFound();

  const conversacion = resolverConversacionAvistamiento(sesion.user.id!, {
    duenoUserId: chat.duenoUserId,
    duenoNombre: chat.duenoNombre,
    duenoImagen: chat.duenoImagen,
    reportanteUserId: chat.reportanteUserId,
    reportanteNombre: chat.reportanteNombre,
    reportanteImagen: chat.reportanteImagen,
    nombreMascota: chat.nombreMascota,
    tipoMascota: chat.tipoMascota,
  });

  const rolOtro = rolParticipante(
    conversacion.otro.userId,
    chat.duenoUserId
  );

  const eventos: EventoCasoTimeline[] = chat.eventos.map((e) => ({
    id: e.id,
    tipo: e.tipo,
    titulo: e.titulo,
    detalle: e.detalle,
    createdAt: e.createdAt,
  }));

  return (
    <EnvolturaPaginasApp>
      <div className="pp-coord pp-coord--standalone">
        <header className="pp-coord-chat-header pp-coord-chat-header--pagina">
          <div className="pp-coord-chat-header-principal">
            {conversacion.otro.imagen ? (
              <img
                src={conversacion.otro.imagen}
                alt=""
                className="pp-coord-chat-header-avatar"
                width={32}
                height={32}
              />
            ) : (
              <span className="pp-coord-chat-header-iniciales" aria-hidden>
                {conversacion.otro.nombre.slice(0, 1)}
              </span>
            )}
            <div>
              <strong>{conversacion.otro.nombre}</strong>
              <EtiquetaRolParticipante rol={rolOtro} />
            </div>
          </div>
          <span className="pp-coord-estado pp-coord-estado--activa">
            {conversacion.mascotaLinea}
          </span>
        </header>

        <div className="pp-coord-standalone-chat">
          <ChatPrivadoCaso
            avistamientoId={chat.avistamiento.id}
            mascotaId={chat.avistamiento.mascotaId}
            numeroReporte={chat.avistamiento.numeroReporte}
            mensajesIniciales={chat.mensajes}
            eventosIniciales={eventos}
            nombreMascota={chat.nombreMascota ?? "Mascota"}
            tipoMascota={chat.tipoMascota}
            miUserId={sesion.user.id!}
            ultimoLeidoInterlocutorAt={chat.ultimoLeidoInterlocutorAt}
          />
        </div>

        {chat.slug && (
          <Link
            href={`/mascota/${chat.slug}`}
            className="btn-mascota btn-mascota--secundario"
            style={{ marginTop: "1rem" }}
          >
            Ver página pública
          </Link>
        )}
      </div>
    </EnvolturaPaginasApp>
  );
}
