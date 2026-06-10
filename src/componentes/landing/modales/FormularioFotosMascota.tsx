"use client";

import { GaleriaFotosMascota } from "@/componentes/mascotas/GaleriaFotosMascota";
import type { CamaraReporteApi } from "@/hooks/useCamaraReporte";

type Props = {
  camara: CamaraReporteApi;
  titulo?: string;
  ayuda?: string;
};

export function FormularioFotosMascota({
  camara,
  titulo = "Fotos de la mascota *",
  ayuda = "Toca para elegir foto (galería o cámara). La primera será la principal.",
}: Props) {
  return (
    <GaleriaFotosMascota
      fotos={camara.fotosPreview}
      maxFotos={camara.maxFotos}
      error={camara.errorArchivo}
      onQuitar={camara.quitarFoto}
      onMarcarPrincipal={camara.marcarPrincipal}
      onInputChange={camara.previewFotos}
      variante="modal"
      titulo={titulo}
      ayuda={ayuda}
    />
  );
}
