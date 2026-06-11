import { SelectorUbicacionMapa } from "@/componentes/landing/ui/SelectorUbicacionMapa";
import { Icono, type NombreIcono } from "@/componentes/ui/Icono";
import { PLACEHOLDER_UBICACION } from "@/lib/mascotas/catalogos";
import type { UbicacionSeleccionada } from "@/lib/geo/tipos";

type Props = {
  tituloSeccion: string;
  etiqueta: string;
  idInput: string;
  icono: NombreIcono;
  valor: UbicacionSeleccionada | null | undefined;
  onChange: (ubicacion: UbicacionSeleccionada) => void;
  direccion: string;
  onDireccionChange: (texto: string) => void;
  children?: React.ReactNode;
};

export function SeccionUbicacionReporte({
  tituloSeccion,
  etiqueta,
  idInput,
  icono,
  valor,
  onChange,
  direccion,
  onDireccionChange,
  children,
}: Props) {
  return (
    <>
      <div className="section-divider">
        <Icono nombre="ubicacion" size={16} className="pp-icon--btn" />{" "}
        {tituloSeccion}
      </div>
      <SelectorUbicacionMapa
        etiqueta={etiqueta}
        idInput={idInput}
        icono={icono}
        placeholder={PLACEHOLDER_UBICACION}
        valor={valor}
        onChange={onChange}
        direccionTexto={direccion}
        onDireccionChange={onDireccionChange}
      />
      {children}
    </>
  );
}
