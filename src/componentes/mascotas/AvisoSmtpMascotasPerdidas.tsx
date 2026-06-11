/**
 * [mascotas] Componente React: aviso smtp mascotas perdidas.
 */
import { correoSoporteConfigurado } from "@/lib/email/transporte";

type Props = {
  hayMascotaPerdida: boolean;
};

/** Aviso en Mis mascotas cuando hay casos activos pero SMTP no está configurado. */
export function AvisoSmtpMascotasPerdidas({ hayMascotaPerdida }: Props) {
  if (!hayMascotaPerdida || correoSoporteConfigurado()) return null;

  return (
    <div className="aviso-smtp-dueno" role="status">
      <strong>Revisa la página de tu mascota con frecuencia.</strong> Los avistamientos se
      guardan aquí en la web. Si activas notificaciones por correo en tu cuenta,
      también te llegarán por email.
    </div>
  );
}
