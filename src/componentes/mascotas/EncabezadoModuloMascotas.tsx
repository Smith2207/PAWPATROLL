import Link from "next/link";

type Props = {
  titulo: string;
  subtitulo?: string;
  ocultarBotonNueva?: boolean;
};

export function EncabezadoModuloMascotas({
  titulo,
  subtitulo,
  ocultarBotonNueva = false,
}: Props) {
  return (
    <div className="mascotas-toolbar">
      <div>
        <h1 style={{ marginBottom: subtitulo ? 4 : 0 }}>{titulo}</h1>
        {subtitulo && <p className="mascotas-toolbar-sub">{subtitulo}</p>}
      </div>
      <div className="mascotas-toolbar-acciones">
        {!ocultarBotonNueva && (
          <Link href="/mis-mascotas/ficha" className="btn-mascota btn-mascota--primario">
            + Nueva ficha
          </Link>
        )}
      </div>
    </div>
  );
}
