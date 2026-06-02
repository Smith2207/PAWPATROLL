import { auth } from "@/auth";
import { obtenerChatPrivadoAvistamiento } from "@/actions/casos";
import { ChatPrivadoCaso } from "@/componentes/casos/ChatPrivadoCaso";
import { EnvolturaPaginasApp } from "@/componentes/layout/EnvolturaPaginasApp";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: "Chat privado — PawPatrol",
};

export default async function PaginaChatAvistamiento({ params }: Props) {
  const sesion = await auth();
  if (!sesion?.user) redirect("/");

  const { id } = await params;
  const chat = await obtenerChatPrivadoAvistamiento(id);
  if (!chat) notFound();

  return (
    <EnvolturaPaginasApp>
      <div className="pp-caso-busqueda pp-chat-pagina">
        <header className="pp-caso-header">
          <div>
            <p className="pp-caso-eyebrow">Comunicación privada</p>
            <h1>
              Avistamiento #{chat.avistamiento.numeroReporte}
              {chat.nombreMascota ? ` · ${chat.nombreMascota}` : ""}
            </h1>
            <p className="pp-caso-sub">
              Solo tú y {chat.esDueno ? "quien reportó" : "el dueño"} pueden ver
              esta conversación.
            </p>
          </div>
        </header>

        <ChatPrivadoCaso
          avistamientoId={chat.avistamiento.id}
          mascotaId={chat.avistamiento.mascotaId}
          numeroReporte={chat.avistamiento.numeroReporte}
          mensajesIniciales={chat.mensajes}
          esDueno={chat.esDueno}
          nombreMascota={chat.nombreMascota ?? "Mascota"}
          nombreReportante={chat.reportanteNombre}
        />

        {chat.slug && (
          <Link href={`/mascota/${chat.slug}`} className="btn-mascota btn-mascota--secundario">
            Ver ficha pública
          </Link>
        )}
      </div>
    </EnvolturaPaginasApp>
  );
}
