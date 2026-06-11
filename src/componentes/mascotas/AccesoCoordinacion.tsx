/**
 * [mascotas] Acceso: coordinacion.
 */
import { Icono, iconoPorTipoMascota } from "@/componentes/ui/Icono";
import Link from "next/link";

type Props = {
  mascotaId: string;
  nombreMascota: string;
  tipo?: string;
  fotoPrincipal?: string | null;
  avistamientosPendientes?: number;
  totalAvistamientos?: number;
  compacto?: boolean;
};

function AvatarMascotaCaso({
  nombre,
  tipo,
  foto,
  size = 48,
}: {
  nombre: string;
  tipo?: string;
  foto?: string | null;
  size?: number;
}) {
  const icono = iconoPorTipoMascota(tipo ?? "");

  if (foto) {
    return (
      <img
        src={foto}
        alt={nombre}
        className="acceso-caso-avatar-img"
        width={size}
        height={size}
      />
    );
  }

  return (
    <span className="acceso-caso-avatar-placeholder" aria-hidden>
      <Icono nombre={icono} size={Math.round(size * 0.5)} />
    </span>
  );
}

function textoPreview(
  totalAvistamientos: number,
  avistamientosPendientes: number
) {
  if (totalAvistamientos === 0) {
    return "Sin reportes aún — te avisamos cuando llegue uno";
  }
  const partes: string[] = [];
  partes.push(
    `${totalAvistamientos} reporte${totalAvistamientos === 1 ? "" : "s"}`
  );
  if (avistamientosPendientes > 0) {
    partes.push(`${avistamientosPendientes} por revisar`);
  }
  return partes.join(" · ");
}

export function AccesoCoordinacion({
  mascotaId,
  nombreMascota,
  tipo,
  fotoPrincipal,
  avistamientosPendientes = 0,
  totalAvistamientos = 0,
  compacto = false,
}: Props) {
  const url = `/mis-mascotas/${mascotaId}/caso`;

  if (compacto) {
    return (
      <Link href={url} className="acceso-caso acceso-caso--compacto pp-enlace-icono">
        <span className="acceso-caso-avatar acceso-caso-avatar--sm">
          <AvatarMascotaCaso
            nombre={nombreMascota}
            tipo={tipo}
            foto={fotoPrincipal}
            size={28}
          />
        </span>
        Coordinar {nombreMascota}
        {avistamientosPendientes > 0 && (
          <span className="acceso-caso-badge">{avistamientosPendientes}</span>
        )}
        <Icono nombre="derecha" size={14} />
      </Link>
    );
  }

  return (
    <Link href={url} className="acceso-caso acceso-caso--enlace">
      <span className="acceso-caso-avatar">
        <AvatarMascotaCaso
          nombre={nombreMascota}
          tipo={tipo}
          foto={fotoPrincipal}
        />
        {avistamientosPendientes > 0 && (
          <span className="acceso-caso-avatar-badge" aria-hidden>
            {avistamientosPendientes > 9 ? "9+" : avistamientosPendientes}
          </span>
        )}
      </span>
      <span className="acceso-caso-texto">
        <span className="acceso-caso-nombre">Coordinar {nombreMascota}</span>
        <span className="acceso-caso-preview">
          {textoPreview(totalAvistamientos, avistamientosPendientes)}
        </span>
      </span>
      <Icono nombre="derecha" size={18} className="acceso-caso-flecha" />
    </Link>
  );
}
