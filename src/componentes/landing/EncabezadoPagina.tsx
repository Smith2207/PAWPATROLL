type Props = {
  titulo: string;
  descripcion?: string;
};

export function EncabezadoPagina({ titulo, descripcion }: Props) {
  return (
    <header className="pp-encabezado-pagina">
      <h1>{titulo}</h1>
      {descripcion && <p>{descripcion}</p>}
    </header>
  );
}
