import { BarraNavegacion } from "@/componentes/landing/BarraNavegacion";
import { PiePagina } from "@/componentes/landing/PiePagina";

type Props = {
  children: React.ReactNode;
  errorCarga?: boolean;
};

export function ContenedorPublico({ children, errorCarga }: Props) {
  return (
    <>
      <BarraNavegacion />
      {errorCarga && (
        <div className="pp-alerta-carga" role="alert">
          No pudimos cargar datos desde el servidor. Comprueba{" "}
          <code>DATABASE_URL</code> y las migraciones (<code>pnpm db:push</code>
          ).
        </div>
      )}
      <main className="pp-pagina-publica">{children}</main>
      <PiePagina />
    </>
  );
}
