/**
 * [landing] Contenedor: publico.
 */
import { BarraNavegacion } from "@/componentes/landing/BarraNavegacion";
import { PiePagina } from "@/componentes/landing/PiePagina";

type Props = {
  children: React.ReactNode;
  errorCarga?: boolean;
};

export function ContenedorPublico({ children, errorCarga }: Props) {
  const esDev = process.env.NODE_ENV === "development";

  return (
    <>
      <BarraNavegacion />
      {errorCarga && (
        <div className="pp-alerta-carga" role="alert">
          {esDev ? (
            <>
              No pudimos cargar datos desde el servidor. Comprueba{" "}
              <code>DATABASE_URL</code> y las migraciones (
              <code>npm run db:push</code>).
            </>
          ) : (
            <>
              No pudimos cargar la información en este momento. Recarga la
              página o inténtalo de nuevo en unos minutos.
            </>
          )}
        </div>
      )}
      <main className="pp-pagina-publica">{children}</main>
      <PiePagina />
    </>
  );
}
