import { obtenerContactoPerfil } from "@/actions/autenticacion";
import { auth } from "@/auth";
import { obtenerMascotaPropia } from "@/actions/mascotas";
import { BotonEliminarMascota } from "@/componentes/mascotas/BotonEliminarMascota";
import { FormularioFichaMascota } from "@/componentes/mascotas/FormularioFichaMascota";
import { HistorialEstadosMascota } from "@/componentes/mascotas/HistorialEstadosMascota";
import { PanelCambioEstado } from "@/componentes/mascotas/PanelCambioEstado";
import { BadgeEstadoMascota } from "@/componentes/mascotas/BadgeEstadoMascota";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EnvolturaPaginasApp } from "@/componentes/layout/EnvolturaPaginasApp";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PaginaEditarMascota({ params }: Props) {
  const sesion = await auth();
  if (!sesion?.user) redirect("/");

  const { id } = await params;
  const [datos, contactoPerfil] = await Promise.all([
    obtenerMascotaPropia(id),
    obtenerContactoPerfil(),
  ]);

  if (!datos) notFound();

  const { mascota, fotos, historial } = datos;

  return (
    <EnvolturaPaginasApp>
    <div className="panel-cuenta">
      <div className="mascotas-toolbar">
        <div>
          <h1 style={{ marginBottom: 4 }}>{mascota.nombre}</h1>
          <BadgeEstadoMascota estado={mascota.estado} />
        </div>
        <Link href="/mis-mascotas" className="btn-mascota btn-mascota--secundario">
          ← Listado
        </Link>
      </div>

      <div className="ficha-mascota-layout">
        <div>
          <PanelCambioEstado mascota={mascota} />
          <div className="tarjeta-panel" style={{ marginTop: "1.25rem" }}>
            <h2>Historial de estados</h2>
            <HistorialEstadosMascota historial={historial} />
          </div>
          <div style={{ marginTop: "1rem" }}>
            <BotonEliminarMascota id={mascota.id} nombre={mascota.nombre} />
          </div>
        </div>

        <div className="tarjeta-panel tarjeta-panel--form-ficha">
          <h2>Ficha de {mascota.nombre}</h2>
          <FormularioFichaMascota
            modo="editar"
            mascota={mascota}
            fotosIniciales={fotos.map((f) => f.url)}
            contactoPerfil={contactoPerfil ?? undefined}
          />
        </div>
      </div>
    </div>
    </EnvolturaPaginasApp>
  );
}
