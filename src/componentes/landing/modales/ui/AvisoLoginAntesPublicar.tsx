/**
 * [landing] Componente React: aviso login antes publicar.
 */
type Props = {
  visible: boolean;
  mensaje: string;
};

export function AvisoLoginAntesPublicar({ visible, mensaje }: Props) {
  if (!visible) return null;
  return (
    <p className="auth-alerta auth-alerta--info" role="note">
      {mensaje}
    </p>
  );
}
