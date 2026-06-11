import type {
  MarcadorAvistamientoMapa,
  MarcadorPerdidaMapa,
} from "@/actions/mapa";
import { pareceCoordenadas } from "@/lib/geo/etiqueta-ubicacion";
import { tituloPopupMapa } from "@/lib/geo/iconos-mapa-html";

function textoDireccion(direccion: string | null): string {
  if (!direccion || pareceCoordenadas(direccion)) return "Zona reportada";
  return direccion;
}

function miniaturaPopup(foto: string | null, nombre: string): string {
  if (!foto?.startsWith("data:image/") && !foto?.startsWith("http")) {
    return "";
  }
  const src = foto.replace(/"/g, "&quot;");
  return `<div class="pp-popup-foto"><img src="${src}" alt="${nombre}" /></div>`;
}

export function popupZonaBusqueda(
  nombre: string,
  radioMetros: number,
  desplazado: boolean
): string {
  return `<div class="pp-popup-titulo">Zona de búsqueda — ${nombre}</div><div class="pp-popup-meta">~${(radioMetros / 1000).toFixed(1)} km${desplazado ? " · centro ajustado por avistamientos" : " desde donde se perdió"}</div>`;
}

export function popupPerdida(
  p: MarcadorPerdidaMapa,
  esMapaIndividual: boolean
): string {
  const enlace = esMapaIndividual
    ? ""
    : `<a class="pp-popup-link" href="/mascota/${p.slug}">Ver mascota <span class="pp-popup-flecha">›</span></a>`;
  const cerco = p.prediccion?.cerco;
  const lineaCerco = cerco
    ? `Cerco: ~${(p.radioMetros / 1000).toFixed(1)} km — ${cerco.motivoAjuste}`
    : `Cerco de búsqueda: ~${(p.radioMetros / 1000).toFixed(1)} km (raza, tamaño y tiempo perdido)`;
  const perfil = p.prediccion?.perfilConductual.etiqueta
    ? `<div class="pp-popup-meta">${p.prediccion.perfilConductual.etiqueta}</div>`
    : "";
  return `
    ${miniaturaPopup(p.fotoPrincipal, p.nombre)}
    <div class="pp-popup-titulo">${tituloPopupMapa("ubicacion", `Se perdió aquí — ${p.nombre}`)}</div>
    <div class="pp-popup-meta">${p.tipo}${p.lugarPerdida ? ` · ${p.lugarPerdida}` : ""}</div>
    ${perfil}
    <div class="pp-popup-meta">${lineaCerco}</div>
    <div class="pp-popup-meta">${p.totalAvistamientos} avistamiento(s) registrados</div>
    ${enlace}
  `;
}

export function popupPerdidaComunidad(p: MarcadorPerdidaMapa): string {
  return `
    ${miniaturaPopup(p.fotoPrincipal, p.nombre)}
    <div class="pp-popup-titulo">${tituloPopupMapa("ubicacion", `Se perdió aquí — ${p.nombre}`)}</div>
    <div class="pp-popup-meta">${p.tipo}${p.lugarPerdida ? ` · ${p.lugarPerdida}` : ""}</div>
    <a class="pp-popup-link" href="/mascota/${p.slug}">Ver mascota con mapa detallado <span class="pp-popup-flecha">›</span></a>
  `;
}

export function popupAvistamiento(a: MarcadorAvistamientoMapa): string {
  const titulo = a.nombreMascota
    ? `${a.nombreMascota} — Avistamiento #${a.numeroReporte}`
    : `Avistamiento #${a.numeroReporte}`;
  const foto = a.fotoAvistamiento ?? a.fotoMascota;
  return `
    ${miniaturaPopup(foto, a.nombreMascota ?? "Mascota")}
    <div class="pp-popup-titulo">${titulo}</div>
    <div class="pp-popup-meta">${textoDireccion(a.direccion)}</div>
    ${a.slugMascota ? `<a class="pp-popup-link" href="/mascota/${a.slugMascota}">Ver mascota <span class="pp-popup-flecha">›</span></a>` : ""}
  `;
}

export function popupGrupoAvistamientos(
  grupo: MarcadorAvistamientoMapa[]
): string {
  if (grupo.length === 1) return popupAvistamiento(grupo[0]);

  return grupo
    .map(
      (a, i) =>
        `${i > 0 ? '<div class="pp-popup-separador"></div>' : ""}${popupAvistamiento(a)}`
    )
    .join("");
}

export function popupRefugioProbable(
  etiqueta: string,
  probabilidad: number
): string {
  return `<div class="pp-popup-titulo">${tituloPopupMapa("casa", "Refugio probable")}</div><div class="pp-popup-meta">${etiqueta} · ${Math.round(probabilidad * 100)}%</div>`;
}

export function popupUbicacionUsuario(etiqueta: string): string {
  return `<div class="pp-popup-titulo">${tituloPopupMapa("ubicacion", "Estás aquí")}</div><div class="pp-popup-meta">${etiqueta}</div>`;
}
