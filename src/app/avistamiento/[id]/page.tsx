/**
 * Ruta /avistamiento/[id]. Página principal de la ruta.
 */
import { auth } from "@/auth";
import { obtenerChatPrivadoAvistamiento } from "@/actions/chat";
import { VistaChatAvistamiento } from "@/componentes/casos/VistaChatAvistamiento";
import { EnvolturaPaginasApp } from "@/componentes/layout/EnvolturaPaginasApp";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: "Conversación — PawPatrol",
};

export default async function PaginaChatAvistamiento({ params }: Props) {
  const sesion = await auth();
  if (!sesion?.user) redirect("/");

  const { id } = await params;
  const chat = await obtenerChatPrivadoAvistamiento(id);
  if (!chat) notFound();

  return (
    <EnvolturaPaginasApp>
      <VistaChatAvistamiento
        avistamiento={chat.avistamiento}
        mascota={chat.mascota}
        resumenCabecera={chat.resumenCabecera}
        mensajes={chat.mensajes}
        eventos={chat.eventos}
        esDueno={chat.esDueno}
        miUserId={sesion.user.id!}
        duenoUserId={chat.duenoUserId}
        duenoNombre={chat.duenoNombre}
        duenoImagen={chat.duenoImagen}
        reportanteUserId={chat.reportanteUserId}
        reportanteNombre={chat.reportanteNombre}
        reportanteImagen={chat.reportanteImagen}
        nombreMascota={chat.nombreMascota ?? null}
        tipoMascota={chat.tipoMascota ?? null}
        ultimoLeidoInterlocutorAt={chat.ultimoLeidoInterlocutorAt}
      />
    </EnvolturaPaginasApp>
  );
}
