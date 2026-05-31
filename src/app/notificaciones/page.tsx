import { auth } from "@/auth";
import {
  listarNotificacionesUsuario,
  marcarTodasNotificacionesLeidas,
} from "@/actions/notificaciones";
import { PanelNotificaciones } from "@/componentes/notificaciones/PanelNotificaciones";
import { EnvolturaPaginasApp } from "@/componentes/layout/EnvolturaPaginasApp";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notificaciones — PawPatrol",
};

export default async function PaginaNotificaciones() {
  const sesion = await auth();
  if (!sesion?.user) redirect("/");

  const notificaciones = await listarNotificacionesUsuario(60);

  return (
    <EnvolturaPaginasApp>
      <div className="pp-notif-pagina">
        <header className="pp-notif-pagina-header">
          <div>
            <h1>Centro de notificaciones</h1>
            <p>Solo eventos relevantes para ti. Nada de spam ni avisos globales.</p>
          </div>
          <form
            action={async () => {
              "use server";
              await marcarTodasNotificacionesLeidas();
            }}
          >
            <button type="submit" className="btn-mascota btn-mascota--secundario">
              Marcar todas como leídas
            </button>
          </form>
        </header>
        <PanelNotificaciones inicial={notificaciones} />
      </div>
    </EnvolturaPaginasApp>
  );
}
