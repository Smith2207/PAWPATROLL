import { EnvolturaPaginasApp } from "@/componentes/layout/EnvolturaPaginasApp";
import { ListaNotificacionesPagina } from "@/componentes/notificaciones/ListaNotificacionesPagina";

export const metadata = {
  title: "Notificaciones — PawPatrol",
};

export default function PaginaNotificaciones() {
  return (
    <EnvolturaPaginasApp>
      <ListaNotificacionesPagina />
    </EnvolturaPaginasApp>
  );
}
