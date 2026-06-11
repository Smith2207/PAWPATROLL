"use client";



/**
 * [mascotas] Componente React: subir fotos mascota.
 */
/**
 * [mascotas] Componente React: subir fotos mascota.
 */
import { GaleriaFotosMascota } from "@/componentes/mascotas/GaleriaFotosMascota";
import { useFotosMascota } from "@/hooks/useFotosMascota";

type Props = {
  fotos: string[];
  onFotosChange: (fotos: string[]) => void;
};

export function SubirFotosMascota({ fotos, onFotosChange }: Props) {
  const galeria = useFotosMascota({ fotos, onFotosChange });

  return (
    <GaleriaFotosMascota
      fotos={galeria.fotos}
      maxFotos={galeria.maxFotos}
      error={galeria.errorArchivo}
      onQuitar={galeria.quitarFoto}
      onMarcarPrincipal={galeria.marcarPrincipal}
      onInputChange={galeria.previewFotos}
      variante="ficha"
    />
  );
}
