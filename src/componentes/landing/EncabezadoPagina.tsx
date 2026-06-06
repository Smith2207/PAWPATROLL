type Props = {
  titulo: string;
  descripcion?: string;
  eyebrow?: string;
};

export function EncabezadoPagina({ titulo, descripcion, eyebrow }: Props) {
  return (
    <header className="pp-encabezado-pagina">
      {eyebrow && <p className="pp-encabezado-eyebrow">{eyebrow}</p>}
      <h1>{titulo}</h1>
      {descripcion && <p>{descripcion}</p>}
    </header>
  );
}
