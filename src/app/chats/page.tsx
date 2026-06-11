/**
 * Ruta /chats. Página principal de la ruta.
 */
import { auth } from "@/auth";
import { listarConversaciones } from "@/actions/chat";
import { ContenedorHubChats } from "@/componentes/casos/ContenedorHubChats";
import { EnvolturaPaginasApp } from "@/componentes/layout/EnvolturaPaginasApp";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mensajes — PawPatroll",
  description: "Conversaciones vinculadas a reportes de avistamiento.",
};

export default async function PaginaChats() {
  const sesion = await auth();
  if (!sesion?.user) redirect("/");

  const conversaciones = await listarConversaciones();

  return (
    <EnvolturaPaginasApp>
      <div className="panel-cuenta panel-cuenta--chats">
        <header className="mascotas-lista-cabecera">
          <div>
            <h1>Mensajes</h1>
            <p className="mascotas-lista-resumen">
              Un chat por cada reporte: como dueño ves todos los de tu mascota;
              como testigo solo el tuyo.
            </p>
          </div>
        </header>

        <ContenedorHubChats conversacionesIniciales={conversaciones} />
      </div>
    </EnvolturaPaginasApp>
  );
}
