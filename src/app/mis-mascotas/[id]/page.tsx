import { obtenerContactoPerfil } from "@/actions/autenticacion";
import { auth } from "@/auth";
import { obtenerMascotaPropia } from "@/actions/mascotas";
import { BotonEliminarMascota } from "@/componentes/mascotas/BotonEliminarMascota";
import { FormularioFichaMascota } from "@/componentes/mascotas/FormularioFichaMascota";
import { PanelCambioEstado } from "@/componentes/mascotas/PanelCambioEstado";
import { BadgeEstadoMascota } from "@/componentes/mascotas/BadgeEstadoMascota";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EnvolturaPaginasApp } from "@/componentes/layout/EnvolturaPaginasApp";
import { Icono } from "@/componentes/ui/Icono";

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

  const { mascota, fotos } = datos;
  const fotoPrincipal =
    fotos.find((f) => f.esPrincipal)?.url ?? fotos[0]?.url ?? null;
  const mascotaPanel = { ...mascota, fotoPrincipal };

  return (
    <EnvolturaPaginasApp>
    <div className="panel-cuenta">
      <div className="mascotas-toolbar">
        <div>
          <h1 style={{ marginBottom: 4 }}>{mascota.nombre}</h1>
          <BadgeEstadoMascota estado={mascota.estado} />
        </div>
        <Link href="/mis-mascotas" className="btn-mascota btn-mascota--secundario pp-enlace-icono">
          <Icono nombre="izquierda" size={14} />
          Listado
        </Link>
        {(mascota.estado === "PERDIDA" || mascota.estado === "ENCONTRADA") && (
          <Link
            href={`/mis-mascotas/${mascota.id}/caso`}
            className="btn-mascota pp-enlace-icono"
          >
            <Icono nombre="mensaje" size={16} className="pp-icon--btn" />
            Mensajes y avistamientos
          </Link>
        )}
      </div>

      <div className="ficha-mascota-layout">
        <div>
          <PanelCambioEstado mascota={mascotaPanel} />
          <div style={{ marginTop: "1rem" }}>
            <BotonEliminarMascota id={mascota.id} nombre={mascota.nombre} />
          </div>
        </div>

        <div className="tarjeta-panel tarjeta-panel--form-ficha">
          <h2>Mascota: {mascota.nombre}</h2>
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
