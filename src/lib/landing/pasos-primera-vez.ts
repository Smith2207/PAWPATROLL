import type { NombreIcono } from "@/componentes/ui/Icono";

export const PASOS_PRIMERA_VEZ: {
  icono: NombreIcono;
  titulo: string;
  texto: string;
}[] = [
  {
    icono: "lista",
    titulo: "Perdiste a tu mascota",
    texto:
      "Botón naranja «Perdí a mi mascota» → datos, foto y ubicación → publicar.",
  },
  {
    icono: "ojo",
    titulo: "Viste una mascota",
    texto: "«Vi una mascota» con ubicación (y foto si puedes).",
  },
  {
    icono: "mapa",
    titulo: "Mapa y casos",
    texto:
      "Comunidad = mapa con cercos y avistamientos. Casos activos = buscar mascotas.",
  },
];
