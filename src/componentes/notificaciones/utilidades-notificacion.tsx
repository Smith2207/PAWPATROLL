import { Icono, type NombreIcono } from "@/componentes/ui/Icono";

export function nombreIconoNotificacion(tipo: string): NombreIcono {
  if (tipo.includes("AVISTAMIENTO")) return "ojo";
  if (tipo === "MENSAJE_NUEVO") return "mensaje";
  if (tipo === "COINCIDENCIA_IA") return "camara";
  if (tipo === "CASO_RECUPERADO") return "celebracion";
  if (tipo === "REPORTE_ABUSO_ADMIN") return "alerta";
  return "campana";
}

export function IconoNotificacion({
  tipo,
  size = 18,
}: {
  tipo: string;
  size?: number;
}) {
  return <Icono nombre={nombreIconoNotificacion(tipo)} size={size} />;
}
