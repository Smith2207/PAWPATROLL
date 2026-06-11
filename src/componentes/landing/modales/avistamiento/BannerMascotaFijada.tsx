/**
 * [avistamiento] Banner cuando el reporte viene desde la ficha de una mascota.
 */
import { Icono } from "@/componentes/ui/Icono";

type Props = {
  id: string;
  nombre: string;
};

export function BannerMascotaFijada({ id, nombre }: Props) {
  return (
    <div className="pp-avistamiento-ficha-fijada" role="status">
      <span className="pp-avistamiento-ficha-fijada-icono">
        <Icono nombre="huella" size={24} />
      </span>
      <div>
        <strong>Mascota: {nombre}</strong>
      </div>
      <input type="hidden" name="mascotaId" value={id} />
    </div>
  );
}
