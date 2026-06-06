import { auth } from "@/auth";
import { listarHubChats } from "@/actions/casos";
import { ContenedorHubChats } from "@/componentes/casos/ContenedorHubChats";
import { EnvolturaPaginasApp } from "@/componentes/layout/EnvolturaPaginasApp";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mensajes — PawPatroll",
  description: "Conversaciones de coordinación de búsqueda.",
};

export default async function PaginaChats() {
  const sesion = await auth();
  if (!sesion?.user) redirect("/");

  const { casosDueno, casosTestigo } = await listarHubChats();

  return (
    <EnvolturaPaginasApp>
      <div className="panel-cuenta panel-cuenta--chats">
        <header className="mascotas-lista-cabecera">
          <div>
            <h1>Mensajes</h1>
            <p className="mascotas-lista-resumen">
              Coordinación con testigos y dueños en casos activos.
            </p>
          </div>
        </header>

        <ContenedorHubChats
          casosDuenoIniciales={casosDueno}
          casosTestigoIniciales={casosTestigo}
        />
      </div>
    </EnvolturaPaginasApp>
  );
}
