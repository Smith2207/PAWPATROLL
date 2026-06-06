"use client";

import { obtenerEstadoBienvenida } from "@/actions/autenticacion";
import { ModalBienvenida } from "@/componentes/auth/ModalBienvenida";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export function GestorBienvenida() {
  const { status } = useSession();
  const [mostrar, setMostrar] = useState(false);
  const [datos, setDatos] = useState<{
    nombre: string;
    telefono: string;
    ciudad: string;
  } | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;

    let activo = true;

    obtenerEstadoBienvenida().then((resultado) => {
      if (!activo) return;
      if (resultado.ok && !resultado.completada) {
        setDatos({
          nombre: resultado.nombre ?? "",
          telefono: resultado.telefono ?? "",
          ciudad: resultado.ciudad ?? "",
        });
        setMostrar(true);
      }
    });

    return () => {
      activo = false;
    };
  }, [status]);

  if (status !== "authenticated" || !mostrar || !datos) return null;

  return (
    <ModalBienvenida
      nombreInicial={datos.nombre}
      telefonoInicial={datos.telefono}
      ciudadInicial={datos.ciudad}
      onCerrar={() => setMostrar(false)}
    />
  );
}
