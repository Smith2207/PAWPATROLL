import { auth } from "@/auth";
import { listarMisMascotas } from "@/actions/mascotas";
import { AvisoSmtpDueño } from "@/componentes/mascotas/AvisoSmtpDueño";
import { TarjetaMascotaLista } from "@/componentes/mascotas/TarjetaMascotaLista";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EnvolturaPaginasApp } from "@/componentes/layout/EnvolturaPaginasApp";

export default async function PaginaMisMascotas() {
  const sesion = await auth();
  if (!sesion?.user) redirect("/");

  const mascotas = await listarMisMascotas();
  const perdidas = mascotas.filter((m) => m.estado === "PERDIDA").length;
  const enCasa = mascotas.filter((m) => m.estado === "EN_CASA").length;
  const avistamientosPendientes = mascotas.reduce(
    (s, m) => s + (m.avistamientosPendientes ?? 0),
    0
  );

  return (
    <EnvolturaPaginasApp>
      <div className="panel-cuenta panel-cuenta--mis-mascotas">
        <header className="mascotas-lista-cabecera">
          <div>
            <h1>Mis mascotas</h1>
            {mascotas.length > 0 && (
              <p className="mascotas-lista-resumen">
                {mascotas.length}{" "}
                {mascotas.length === 1 ? "registrada" : "registradas"}
                {enCasa > 0 && (
                  <>
                    {" "}
                    · {enCasa} en casa
                  </>
                )}
                {perdidas > 0 && (
                  <>
                    {" "}
                    ·{" "}
                    <span className="mascotas-lista-resumen--alerta">
                      {perdidas} perdida{perdidas === 1 ? "" : "s"}
                    </span>
                  </>
                )}
              </p>
            )}
          </div>
          {mascotas.length > 0 && (
            <Link href="/mis-mascotas/ficha" className="btn-mascota btn-mascota--primario">
              + Nueva ficha
            </Link>
          )}
        </header>

        <AvisoSmtpDueño hayMascotaPerdida={perdidas > 0} />

        {avistamientosPendientes > 0 && (
          <p className="mascotas-alerta-pendientes" role="status">
            Tienes <strong>{avistamientosPendientes}</strong> avistamiento
            {avistamientosPendientes === 1 ? "" : "s"} por revisar en tus fichas
            (marca verificar o descartar en cada reporte).
          </p>
        )}

        {mascotas.length === 0 ? (
          <div className="mascotas-vacio tarjeta-panel">
            <span className="mascotas-vacio-icono" aria-hidden>
              🐾
            </span>
            <h2>Tu primera ficha</h2>
            <p>
              Registra a tu peludo con nombre, tipo y una foto. Después podrás
              marcar si está en casa o perdido.
            </p>
            <Link href="/mis-mascotas/ficha" className="btn-mascota btn-mascota--primario">
              + Crear ficha
            </Link>
          </div>
        ) : (
          <div className="mascotas-grid">
            {mascotas.map((m) => (
              <TarjetaMascotaLista key={m.id} mascota={m} />
            ))}
          </div>
        )}
      </div>
    </EnvolturaPaginasApp>
  );
}
