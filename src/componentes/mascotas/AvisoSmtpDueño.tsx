import { correoSoporteConfigurado } from "@/lib/email/transporte";

type Props = {
  hayMascotaPerdida: boolean;
};

export function AvisoSmtpDueño({ hayMascotaPerdida }: Props) {
  if (!hayMascotaPerdida || correoSoporteConfigurado()) return null;

  return (
    <div className="aviso-smtp-dueno" role="status">
      <strong>Correos de avistamiento desactivados.</strong> Los reportes se
      guardan en la web, pero no llegará email hasta configurar SMTP en el
      servidor. Revisa la ficha con frecuencia o activa Gmail en{" "}
      <code>.env.local</code> (ver README).
    </div>
  );
}
