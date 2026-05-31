import { correoSoporteConfigurado } from "@/lib/email/transporte";

type Props = {
  hayMascotaPerdida: boolean;
};

export function AvisoSmtpDueño({ hayMascotaPerdida }: Props) {
  if (!hayMascotaPerdida || correoSoporteConfigurado()) return null;

  return (
    <div className="aviso-smtp-dueno" role="status">
      <strong>Revisa tu ficha con frecuencia.</strong> Los avistamientos se
      guardan aquí en la web. Si activas notificaciones por correo en tu cuenta,
      también te llegarán por email.
    </div>
  );
}
