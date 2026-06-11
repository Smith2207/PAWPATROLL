/**
 * [landing] Componente React: aviso borrador reporte.
 */
type Props = {
  visible?: boolean;
};

export function AvisoBorradorReporte({ visible = true }: Props) {
  if (!visible) return null;
  return (
    <p className="auth-alerta auth-alerta--info" role="status">
      Recuperamos tu borrador. Revisa los datos y continúa para publicar.
    </p>
  );
}
