"use client";

import { cambiarEstadoMascota } from "@/actions/mascotas";
import { BadgeEstadoMascota } from "@/componentes/mascotas/BadgeEstadoMascota";
import { AccesoCasoBusqueda } from "@/componentes/mascotas/AccesoCasoBusqueda";
import type { EstadoMascota, Mascota } from "@/lib/db/schema";
import {
  ETIQUETAS_ESTADO,
  TRANSICIONES_ESTADO,
  esFichaPublica,
} from "@/lib/mascotas/estados";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icono, type NombreIcono } from "@/componentes/ui/Icono";
import { SelectorUbicacionMapa } from "@/componentes/landing/ui/SelectorUbicacionMapa";
import type { UbicacionSeleccionada } from "@/lib/geo/tipos";
import { coordenadasValidas } from "@/lib/geo/tipos";
import { PLACEHOLDER_UBICACION } from "@/lib/mascotas/catalogos";
import { CampoFechaHora } from "@/componentes/formulario/CampoFechaHora";
import {
  valorDatetimeLocal,
  valorDatetimeLocalActual,
} from "@/lib/fechas/datetime-local";

const ACCIONES: Partial<
  Record<EstadoMascota, { icono: NombreIcono; label: string; variant?: string }>
> = {
  PERDIDA: { icono: "alertaCirculo", label: "Marcar como perdida" },
  ENCONTRADA: { icono: "alertaCirculo", label: "Marcar como encontrada" },
  REUNIDA: { icono: "checkCirculo", label: "Marcar como reunida" },
  EN_CASA: { icono: "casa", label: "Volver a en casa" },
};

type Props = {
  mascota: Mascota & {
    avistamientosPendientes?: number;
    totalAvistamientos?: number;
    fotoPrincipal?: string | null;
  };
};

export function PanelCambioEstado({ mascota }: Props) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [mostrarPerdida, setMostrarPerdida] = useState(false);
  const [lugar, setLugar] = useState(mascota.lugarPerdida ?? "");
  const [fecha, setFecha] = useState(
    mascota.fechaPerdida
      ? valorDatetimeLocal(new Date(mascota.fechaPerdida))
      : valorDatetimeLocalActual()
  );
  const [notas, setNotas] = useState("");
  const [ubicacionPerdida, setUbicacionPerdida] =
    useState<UbicacionSeleccionada | null>(null);

  const transiciones = TRANSICIONES_ESTADO[mascota.estado];

  async function aplicar(estado: EstadoMascota) {
    if (estado === "PERDIDA" && !mostrarPerdida) {
      if (!mascota.fechaPerdida) {
        setFecha(valorDatetimeLocalActual());
      }
      setMostrarPerdida(true);
      return;
    }

    if (estado === "PERDIDA" && !coordenadasValidas(ubicacionPerdida)) {
      setError("Busca la dirección, usa Ubicarme o marca en el mapa dónde se perdió.");
      return;
    }

    setCargando(true);
    setError(null);
    setMensaje(null);

    const resultado = await cambiarEstadoMascota(mascota.id, estado, {
      notas,
      lugarPerdida: estado === "PERDIDA" ? lugar : undefined,
      fechaPerdida: estado === "PERDIDA" ? fecha : undefined,
      latPerdida:
        estado === "PERDIDA" && ubicacionPerdida
          ? ubicacionPerdida.lat
          : undefined,
      lngPerdida:
        estado === "PERDIDA" && ubicacionPerdida
          ? ubicacionPerdida.lng
          : undefined,
    });

    setCargando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    setMensaje(resultado.mensaje);
    setMostrarPerdida(false);
    router.refresh();
  }

  return (
    <div className="tarjeta-panel">
      <h2>Estado actual</h2>
      <div style={{ marginBottom: "1rem" }}>
        <BadgeEstadoMascota estado={mascota.estado} />
      </div>

      {esFichaPublica(mascota.estado) && (
        <p style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
          <Link href={`/mascota/${mascota.slug}`} target="_blank" className="pp-enlace-icono">
            Ver ficha pública
            <Icono nombre="derecha" size={14} />
          </Link>
        </p>
      )}

      {mascota.estado === "PERDIDA" && (
        <div style={{ marginBottom: "1rem" }}>
          <AccesoCasoBusqueda
            mascotaId={mascota.id}
            nombreMascota={mascota.nombre}
            tipo={mascota.tipo}
            fotoPrincipal={mascota.fotoPrincipal}
            avistamientosPendientes={mascota.avistamientosPendientes}
            totalAvistamientos={mascota.totalAvistamientos}
          />
        </div>
      )}

      {mensaje && <p className="auth-alerta auth-alerta--ok">{mensaje}</p>}
      {error && <p className="auth-alerta auth-alerta--error">{error}</p>}

      {mostrarPerdida && (
        <div style={{ marginBottom: "1rem" }}>
          <CampoFechaHora
            label="Fecha y hora de pérdida"
            id="perdida-fecha"
            value={fecha}
            onChange={setFecha}
            requerido
          />
          <SelectorUbicacionMapa
            etiqueta="Zona en el mapa (cerco de búsqueda) *"
            idInput="perdida-map"
            icono="ubicacion"
            placeholder={PLACEHOLDER_UBICACION}
            valor={ubicacionPerdida}
            onChange={setUbicacionPerdida}
            direccionTexto={lugar}
            onDireccionChange={setLugar}
          />
        </div>
      )}

      <div className="form-group">
        <label>Referencia (opcional)</label>
        <input
          type="text"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Ej: Visto cerca al mercado, collar azul..."
        />
      </div>

      <div className="panel-estados">
        {transiciones.map((estado) => (
          <button
            key={estado}
            type="button"
            className="btn-estado"
            disabled={cargando}
            onClick={() => aplicar(estado)}
          >
            {ACCIONES[estado] ? (
              <>
                <Icono
                  nombre={ACCIONES[estado]!.icono}
                  size={16}
                  className="pp-icon--btn"
                />{" "}
                {ACCIONES[estado]!.label}
              </>
            ) : (
              ETIQUETAS_ESTADO[estado]
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
