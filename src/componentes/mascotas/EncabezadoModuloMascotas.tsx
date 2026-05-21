import Link from "next/link";

type Props = {
  titulo: string;
  subtitulo?: string;
};

export function EncabezadoModuloMascotas({ titulo, subtitulo }: Props) {
  return (
    <div className="mascotas-toolbar">
      <div>
        <h1 style={{ marginBottom: subtitulo ? 4 : 0 }}>{titulo}</h1>
        {subtitulo && <p className="mascotas-toolbar-sub">{subtitulo}</p>}
      </div>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <Link href="/mis-mascotas/nueva" className="btn-mascota btn-mascota--primario">
          + Nueva mascota
        </Link>
        <Link href="/perfil" className="btn-mascota btn-mascota--secundario">
          Mi perfil
        </Link>
      </div>
    </div>
  );
}
