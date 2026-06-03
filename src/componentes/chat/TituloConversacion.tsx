type Props = {
  linea1: string;
  linea2?: string;
  className?: string;
  /** Si true, la primera línea usa estilo mascota (más suave). */
  varianteCaso?: boolean;
};

/** Encabezado de conversación de caso mascota: «🐶 Max» + nombre del otro participante. */
export function TituloConversacion({
  linea1,
  linea2,
  className = "",
  varianteCaso = false,
}: Props) {
  return (
    <span className={`pp-conv-titulo ${className}`.trim()}>
      <span
        className={
          varianteCaso ? "pp-conv-titulo-mascota" : "pp-conv-titulo-principal"
        }
      >
        {linea1}
      </span>
      {linea2 && (
        <span className="pp-conv-titulo-participante">{linea2}</span>
      )}
    </span>
  );
}
