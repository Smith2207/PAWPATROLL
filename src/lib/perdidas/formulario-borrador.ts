/**
 * Librería (perdidas): formulario-borrador.
 */
import type { DatosFichaMascota } from "@/lib/db/schema";
import { etiquetaVisibleUbicacion } from "@/lib/geo/etiqueta-ubicacion";
import type { UbicacionSeleccionada } from "@/lib/geo/tipos";
import { coordenadasValidas } from "@/lib/geo/tipos";
import {
  MSG_UBICACION_PERDIDA,
  MSG_UBICACION_CORTA_PERDIDA,
  errorSiSinUbicacion,
} from "@/lib/reportes/validaciones";
import type { BorradorReportePerdida } from "@/lib/perdidas/borrador-cliente";
import type { ValoresInicialesFichaMascota } from "@/lib/perdidas/tipos-ficha";
import type { Coordenadas } from "@/lib/geo/tipos";

export function validarPaso1Perdida(
  form: HTMLFormElement,
  ubicacion: UbicacionSeleccionada | null,
  fotos: string[]
): string | null {
  const nombre = form.elements.namedItem("nombre");
  const nombreVal =
    nombre instanceof HTMLInputElement ? nombre.value.trim() : "";
  if (!nombreVal) return "Escribe el nombre de tu mascota.";

  const tipo = form.elements.namedItem("tipo");
  const tipoVal = tipo instanceof HTMLSelectElement ? tipo.value : "";
  if (!tipoVal) return "Indica si es perro o gato.";

  const errUbicacion = errorSiSinUbicacion(ubicacion, MSG_UBICACION_PERDIDA);
  if (errUbicacion) return errUbicacion;

  if (fotos.length === 0) {
    return "Sube al menos una foto de tu mascota.";
  }

  return null;
}

export function validarPaso2Perdida(form: HTMLFormElement): string | null {
  const acceso = form.elements.namedItem("accesoExterior");
  const accesoVal =
    acceso instanceof HTMLSelectElement ? acceso.value : "";
  if (!accesoVal) {
    return "Indica si tu mascota suele salir sola al exterior.";
  }

  const fecha = form.elements.namedItem("fechaPerdida");
  const fechaVal = fecha instanceof HTMLInputElement ? fecha.value : "";
  if (!fechaVal) return "Indica cuándo se perdió.";

  return null;
}

export function validarPublicacionPerdida(
  form: HTMLFormElement,
  ubicacion: UbicacionSeleccionada | null,
  fotos: string[]
): { error: string; paso: 1 | 2 } | null {
  const err1 = validarPaso1Perdida(form, ubicacion, fotos);
  if (err1) return { error: err1, paso: 1 };

  const err2 = validarPaso2Perdida(form);
  if (err2) return { error: err2, paso: 2 };

  const errUbicacion = errorSiSinUbicacion(
    ubicacion,
    MSG_UBICACION_CORTA_PERDIDA
  );
  if (errUbicacion) return { error: errUbicacion, paso: 1 };

  return null;
}

export function validarAvancePasoPerdida(
  paso: number,
  form: HTMLFormElement,
  ubicacion: UbicacionSeleccionada | null,
  fotos: string[]
): string | null {
  if (paso === 1) return validarPaso1Perdida(form, ubicacion, fotos);
  if (paso === 2) return validarPaso2Perdida(form);
  return null;
}

export function armarBorradorPerdida(
  fd: FormData,
  ubicacion: UbicacionSeleccionada,
  direccion: string,
  fotos: string[]
): BorradorReportePerdida | { error: string } {
  const nombre = fd.get("nombre")?.toString() ?? "";
  const tipo = fd.get("tipo")?.toString() ?? "";
  const referencias = fd.get("referenciasZona")?.toString().trim();
  const contactoNombre = fd.get("contactoNombre")?.toString().trim();
  const contactoTel = fd.get("contactoTelefono")?.toString().trim();
  const contactoEmail = fd.get("contactoEmail")?.toString().trim();
  const recompensa = fd.get("recompensa")?.toString().trim();

  const lugarBase =
    direccion.trim() ||
    etiquetaVisibleUbicacion(ubicacion) ||
    "Zona reportada";
  const lugarPerdida = referencias
    ? `${lugarBase} · ${referencias}`
    : lugarBase;

  let descripcion = fd.get("descripcion")?.toString().trim() || "";
  if (recompensa) {
    descripcion = descripcion
      ? `${descripcion}\n\nRecompensa: ${recompensa}`
      : `Recompensa: ${recompensa}`;
  }

  const partesContacto = [contactoNombre, contactoTel, contactoEmail].filter(
    Boolean
  );
  const contactoPublico =
    partesContacto.length > 0 ? partesContacto.join(" · ") : undefined;

  if (fotos.length === 0) {
    return { error: "Sube al menos una foto de tu mascota." };
  }

  const acceso = fd.get("accesoExterior")?.toString();
  if (!acceso) {
    return { error: "Indica si tu mascota suele salir sola al exterior." };
  }

  if (!coordenadasValidas(ubicacion)) {
    return { error: "Marca en el mapa dónde se perdió." };
  }

  const datosMascota: DatosFichaMascota = {
    nombre,
    tipo,
    raza: fd.get("raza")?.toString(),
    sexo: fd.get("sexo")?.toString(),
    color: fd.get("color")?.toString(),
    tamano: fd.get("tamano")?.toString(),
    edad: fd.get("edad")?.toString(),
    accesoExterior: fd.get("accesoExterior")?.toString(),
    descripcion: descripcion || undefined,
    contactoPublico,
  };

  return {
    datosMascota,
    fotos,
    perdida: {
      lugarPerdida,
      fechaPerdida: fd.get("fechaPerdida")?.toString(),
      latPerdida: ubicacion.lat,
      lngPerdida: ubicacion.lng,
      notas: referencias || undefined,
    },
    guardadoEn: new Date().toISOString(),
    referenciasZona: referencias || undefined,
    contactoNombre: contactoNombre || undefined,
    contactoTelefono: contactoTel || undefined,
    contactoEmail: contactoEmail || undefined,
    recompensa: recompensa || undefined,
  };
}

export function extraerRecompensa(descripcion?: string | null): {
  descripcion: string;
  recompensa: string;
} {
  if (!descripcion) return { descripcion: "", recompensa: "" };
  const idx = descripcion.indexOf("\n\nRecompensa: ");
  if (idx === -1) {
    if (descripcion.startsWith("Recompensa: ")) {
      return { descripcion: "", recompensa: descripcion.slice(12) };
    }
    return { descripcion, recompensa: "" };
  }
  return {
    descripcion: descripcion.slice(0, idx),
    recompensa: descripcion.slice(idx + 14),
  };
}

export type CamposBorradorPerdida = {
  valoresFicha: Required<
    Pick<
      ValoresInicialesFichaMascota,
      | "nombre"
      | "tipo"
      | "sexo"
      | "color"
      | "tamano"
      | "edad"
      | "accesoExterior"
      | "descripcion"
    >
  > &
    Pick<ValoresInicialesFichaMascota, "raza" | "fechaPerdida">;
  ubicacion: Coordenadas;
  direccion: string;
  referenciasZona: string;
  contactoNombre: string;
  contactoTelefono: string;
  contactoEmail: string;
  recompensa: string;
  fotos: string[];
};

export function camposDesdeBorradorPerdida(
  borrador: BorradorReportePerdida
): CamposBorradorPerdida {
  const { descripcion, recompensa: recomp } = extraerRecompensa(
    borrador.datosMascota.descripcion
  );
  const partesLugar = borrador.perdida.lugarPerdida.split(" · ");

  return {
    valoresFicha: {
      nombre: borrador.datosMascota.nombre,
      tipo: borrador.datosMascota.tipo,
      raza: borrador.datosMascota.raza,
      sexo: borrador.datosMascota.sexo ?? "",
      color: borrador.datosMascota.color ?? "",
      tamano: borrador.datosMascota.tamano ?? "",
      edad: borrador.datosMascota.edad ?? "",
      accesoExterior: borrador.datosMascota.accesoExterior ?? "",
      descripcion,
      fechaPerdida: borrador.perdida.fechaPerdida,
    },
    ubicacion: {
      lat: borrador.perdida.latPerdida,
      lng: borrador.perdida.lngPerdida,
    },
    direccion: partesLugar[0] ?? "",
    referenciasZona:
      borrador.referenciasZona ??
      borrador.perdida.notas ??
      partesLugar[1] ??
      "",
    contactoNombre: borrador.contactoNombre ?? "",
    contactoTelefono: borrador.contactoTelefono ?? "",
    contactoEmail: borrador.contactoEmail ?? "",
    recompensa: borrador.recompensa ?? recomp,
    fotos: borrador.fotos,
  };
}
