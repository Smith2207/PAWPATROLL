#!/usr/bin/env node
/**
 * Script de mantenimiento: añade comentarios descriptivos al inicio de cada
 * archivo .ts, .tsx, .mjs y .css (después de use client/server si aplica).
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, basename, dirname } from "node:path";

const RAIZ = join(import.meta.dirname, "..");

const IGNORAR_DIR = new Set([
  "node_modules",
  ".next",
  ".git",
  "drizzle",
  "docs",
  "public",
  "services/pawpatroll-ws/node_modules",
]);

const CSS_DESCRIPCION = {
  "paleta.css": "Variables CSS globales: colores, tipografía y sombras del design system.",
  "iconos.css": "Estilos de iconos Lucide y tamaños usados en la UI.",
  "responsive.css": "Breakpoints y utilidades responsive compartidas.",
  "auth.css": "Estilos de login, registro, recuperación y formularios de cuenta.",
  "landing-pawpatrol.css": "Estilos de la landing pública (hero, secciones, modales).",
  "mascotas.css": "Estilos del módulo mascotas: fichas, listado, galería y estados.",
  "mapa.css": "Estilos del mapa Leaflet, marcadores, filtros y popups.",
  "chat.css": "Estilos del chat privado: burbujas, composer y adjuntos.",
  "coordinacion.css": "Estilos del centro de coordinación y cabecera de casos activos.",
  "perfil.css": "Estilos de la página de perfil y datos personales.",
  "admin.css": "Estilos del panel administrativo.",
  "notificaciones.css": "Estilos de campana, lista y alertas de notificaciones.",
  "visual.css": "Estilos de búsqueda visual por foto e identificación.",
};

const RUTAS = [
  "src",
  "scripts",
  "services/pawpatroll-ws",
  "auth.config.ts",
  "auth.ts",
  "drizzle.config.ts",
  "next.config.ts",
  "instrumentation.ts",
  "src/proxy.ts",
].map((p) => join(RAIZ, p));

const NOMBRES_COMPONENTE = {
  Formulario: "Formulario",
  Modal: "Modal",
  Boton: "Botón",
  Panel: "Panel",
  Tarjeta: "Tarjeta",
  Campo: "Campo",
  Encabezado: "Encabezado",
  Barra: "Barra",
  Seccion: "Sección",
  Vista: "Vista",
  Contenedor: "Contenedor",
  Gestor: "Gestor",
  Editor: "Editor",
  Proveedor: "Proveedor",
  Escuchador: "Escuchador",
  Procesador: "Procesador",
  Timeline: "Línea de tiempo",
  Mapa: "Mapa",
  Ficha: "Ficha",
  Galeria: "Galería",
  Acceso: "Acceso",
  Icono: "Icono",
  Overlay: "Overlay",
  Burbuja: "Burbuja",
  Etiqueta: "Etiqueta",
  Meta: "Metadatos",
  Chat: "Chat",
  Hub: "Hub",
};

const RUTAS_APP = {
  "page.tsx": "Página principal de la ruta.",
  "layout.tsx": "Layout compartido de la ruta (estructura y providers).",
  "loading.tsx": "Estado de carga (skeleton) de la ruta.",
  "not-found.tsx": "Página 404 de la ruta.",
  "route.ts": "Handler HTTP de la API.",
  "error.tsx": "Página de error de la ruta.",
};

function camelAHuman(nombre) {
  return nombre
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .toLowerCase();
}

function tituloComponente(nombreArchivo) {
  const base = nombreArchivo.replace(/\.(tsx|ts)$/, "");
  for (const [prefijo, etiqueta] of Object.entries(NOMBRES_COMPONENTE)) {
    if (base.startsWith(prefijo)) {
      const resto = base.slice(prefijo.length) || base;
      return `${etiqueta}: ${camelAHuman(resto)}.`;
    }
  }
  return `Componente React: ${camelAHuman(base)}.`;
}

function rutaApp(rel) {
  const partes = rel.replace(/^src\/app\//, "").split("/");
  const archivo = partes.pop();
  const ruta = "/" + partes.filter((p) => !p.startsWith("(")).join("/");
  const rutaLimpia = ruta === "/" ? "/" : ruta.replace(/\/$/, "");

  if (archivo === "route.ts") {
    const api = rutaLimpia.replace(/^\/api\//, "").replace(/\//g, " › ");
    return `API REST (${rutaLimpia}): endpoint ${api || "raíz"}.`;
  }

  const tipo = RUTAS_APP[archivo] ?? "Vista de la aplicación.";
  if (rutaLimpia === "/") return `Landing pública (inicio). ${tipo}`;
  return `Ruta ${rutaLimpia}. ${tipo}`;
}

function descripcionArchivo(abs, rel) {
  const nombre = basename(abs);
  const ext = nombre.split(".").pop();

  if (rel.startsWith("src/app/")) return rutaApp(rel);

  if (rel.startsWith("src/actions/")) {
    const mod = rel.replace("src/actions/", "").replace(/\.ts$/, "").replace(/\//g, " › ");
    if (nombre === "index.ts") return `Barrel: reexporta acciones del módulo ${dirname(rel).split("/").pop()}.`;
    return `Server Actions (${mod}): operaciones de servidor invocadas desde la UI.`;
  }

  if (rel.startsWith("src/lib/db/")) {
    if (nombre === "schema.ts") return "Esquema Drizzle ORM: tablas, enums y relaciones de PostgreSQL (Neon).";
    if (nombre === "index.ts") return "Cliente de base de datos Drizzle conectado a Neon.";
    return `Librería de base de datos: ${camelAHuman(nombre.replace(/\.ts$/, ""))}.`;
  }

  if (rel.startsWith("src/lib/auth/")) {
    return `Autenticación y autorización: ${camelAHuman(nombre.replace(/\.ts$/, ""))}.`;
  }

  if (rel.startsWith("src/lib/chat/")) {
    return `Chat por avistamiento: ${camelAHuman(nombre.replace(/\.ts$/, ""))}.`;
  }

  if (rel.startsWith("src/lib/casos/")) {
    return `Coordinación de casos (dueño/testigo): ${camelAHuman(nombre.replace(/\.ts$/, ""))}.`;
  }

  if (rel.startsWith("src/lib/reportes/")) {
    return `Permisos y acceso a reportes de avistamiento: ${camelAHuman(nombre.replace(/\.ts$/, ""))}.`;
  }

  if (rel.startsWith("src/lib/avistamientos/")) {
    return `Consultas de avistamientos: ${camelAHuman(nombre.replace(/\.ts$/, ""))}.`;
  }

  if (rel.startsWith("src/lib/mascotas/")) {
    return `Dominio mascotas (fichas, estados, validación): ${camelAHuman(nombre.replace(/\.ts$/, ""))}.`;
  }

  if (rel.startsWith("src/lib/geo/")) {
    return `Geolocalización y mapas: ${camelAHuman(nombre.replace(/\.ts$/, ""))}.`;
  }

  if (rel.startsWith("src/lib/mapa/")) {
    return `Utilidades del mapa Leaflet: ${camelAHuman(nombre.replace(/\.ts$/, ""))}.`;
  }

  if (rel.startsWith("src/lib/visual/")) {
    return `Búsqueda visual por foto (embeddings Gemini/CLIP): ${camelAHuman(nombre.replace(/\.ts$/, ""))}.`;
  }

  if (rel.startsWith("src/lib/comportamiento/")) {
    return `Comportamiento predictivo (M5): ${camelAHuman(nombre.replace(/\.ts$/, ""))}.`;
  }

  if (rel.startsWith("src/lib/tiempo-real/")) {
    return `Tiempo real (WebSocket / hub): ${camelAHuman(nombre.replace(/\.ts$/, ""))}.`;
  }

  if (rel.startsWith("src/lib/email/")) {
    return `Correo transaccional (SMTP): ${camelAHuman(nombre.replace(/\.ts$/, ""))}.`;
  }

  if (rel.startsWith("src/lib/imagen/")) {
    return `Procesamiento y validación de imágenes: ${camelAHuman(nombre.replace(/\.ts$/, ""))}.`;
  }

  if (rel.startsWith("src/lib/api/")) {
    return `Utilidades de API (rate limit, etc.): ${camelAHuman(nombre.replace(/\.ts$/, ""))}.`;
  }

  if (rel.startsWith("src/lib/")) {
    const sub = rel.replace("src/lib/", "").replace(/\/[^/]+$/, "");
    return `Librería (${sub || "utilidades"}): ${camelAHuman(nombre.replace(/\.ts$/, ""))}.`;
  }

  if (rel.startsWith("src/hooks/")) {
    const hook = nombre.replace(/^use/, "").replace(/\.tsx?$/, "");
    return `Hook React: ${camelAHuman(hook)}.`;
  }

  if (rel.startsWith("src/componentes/")) {
    const area = rel.split("/")[2] ?? "ui";
    return `[${area}] ${tituloComponente(nombre)}`;
  }

  if (rel.startsWith("src/contexto/")) {
    return `Contexto React global: ${camelAHuman(nombre.replace(/\.tsx$/, ""))}.`;
  }

  if (rel.startsWith("src/types/")) {
    return `Tipos TypeScript: ${camelAHuman(nombre.replace(/\.d\.ts$/, ""))}.`;
  }

  if (rel === "src/instrumentation.ts") {
    return "Instrumentation Next.js: arranca el servidor WebSocket en desarrollo.";
  }

  if (rel === "src/proxy.ts") {
    return "Middleware (proxy): protege rutas autenticadas y /admin.";
  }

  if (rel === "auth.ts") {
    return "Configuración Auth.js: proveedores, callbacks JWT y sesión.";
  }

  if (rel === "auth.config.ts") {
    return "Opciones compartidas de Auth.js (páginas, estrategia JWT).";
  }

  if (rel === "drizzle.config.ts") {
    return "Configuración de Drizzle Kit para migraciones y push a Neon.";
  }

  if (rel === "next.config.ts") {
    return "Configuración de Next.js (imágenes, experimental, etc.).";
  }

  if (rel.startsWith("scripts/aplicar-migracion")) {
    const num = nombre.match(/(\d{4})/)?.[1];
    return `Script: aplica la migración SQL ${num ?? ""} en Neon.`;
  }

  if (rel.startsWith("scripts/lib/")) {
    return `Script auxiliar (CLI): ${camelAHuman(nombre.replace(/\.mjs$/, ""))}.`;
  }

  if (rel.startsWith("scripts/")) {
    if (nombre === "agregar-comentarios-descriptivos.mjs") {
      return "Script de mantenimiento: añade comentarios descriptivos a archivos del proyecto.";
    }
    return `Script de mantenimiento: ${camelAHuman(nombre.replace(/\.mjs$/, ""))}.`;
  }

  if (rel.startsWith("services/pawpatroll-ws/")) {
    if (nombre === "server.mjs") {
      return "Servidor WebSocket de producción (Railway): tiempo real para mapa y chats.";
    }
    return `Servicio WS: ${camelAHuman(nombre.replace(/\.mjs$/, ""))}.`;
  }

  if (rel.startsWith("src/estilos/") && nombre.endsWith(".css")) {
    return CSS_DESCRIPCION[nombre] ?? `Hoja de estilos: ${nombre}.`;
  }

  if (rel === "src/app/globals.css") {
    return "Estilos globales de la app: reset, tipografía base e imports de módulos CSS.";
  }

  if (ext === "test.ts") {
    return `Pruebas unitarias: ${camelAHuman(nombre.replace(/\.test\.ts$/, ""))}.`;
  }

  return `Módulo ${camelAHuman(nombre.replace(/\.(ts|tsx|mjs)$/, ""))}.`;
}

function tieneComentarioInicial(contenido) {
  const t = contenido.trimStart();
  return (
    t.startsWith("/**") ||
    t.startsWith("/*") ||
    t.startsWith("// #") ||
    t.startsWith("/*!")
  );
}

function insertarComentario(contenido, descripcion, esCss = false) {
  const lineas = contenido.split("\n");
  let i = 0;
  const directivas = [];

  while (i < lineas.length && /^["']use (client|server)["'];?\s*$/.test(lineas[i].trim())) {
    directivas.push(lineas[i]);
    i++;
  }

  // Líneas en blanco tras directivas
  while (i < lineas.length && lineas[i].trim() === "") {
    directivas.push(lineas[i]);
    i++;
  }

  const bloque = esCss
    ? `/* ${descripcion} */\n`
    : `/**\n * ${descripcion}\n */`;
  const resto = lineas.slice(i).join("\n");
  const prefijo = directivas.length ? directivas.join("\n") + "\n\n" : "";
  const separador = esCss ? "" : "\n";
  return prefijo + bloque + separador + (resto ? resto : "");
}

function recorrer(dir, archivos = []) {
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) {
    if (/\.(ts|tsx|mjs)$/.test(dir)) archivos.push(dir);
    return archivos;
  }

  for (const entrada of readdirSync(dir)) {
    const abs = join(dir, entrada);
    const rel = relative(RAIZ, abs);
    if (IGNORAR_DIR.has(entrada) || [...IGNORAR_DIR].some((d) => rel.startsWith(d))) continue;
    const st = statSync(abs);
    if (st.isDirectory()) recorrer(abs, archivos);
    else if (
      (/\.(ts|tsx|mjs|css)$/.test(entrada) && !entrada.endsWith(".d.ts")) ||
      (rel.startsWith("services/") && entrada.endsWith(".mjs"))
    ) {
      archivos.push(abs);
    }
  }
  return archivos;
}

const todos = [];
for (const ruta of RUTAS) {
  if (statSync(ruta, { throwIfNoEntry: false })?.isFile()) todos.push(ruta);
  else if (statSync(ruta, { throwIfNoEntry: false })?.isDirectory()) recorrer(ruta, todos);
}

let actualizados = 0;
let omitidos = 0;

for (const abs of todos.sort()) {
  const rel = relative(RAIZ, abs);
  const nombre = basename(abs);
  const original = readFileSync(abs, "utf8");
  if (nombre === "agregar-comentarios-descriptivos.mjs") {
    omitidos++;
    continue;
  }

  if (tieneComentarioInicial(original)) {
    omitidos++;
    continue;
  }
  const descripcion = descripcionArchivo(abs, rel);
  const nuevo = insertarComentario(original, descripcion, abs.endsWith(".css"));
  writeFileSync(abs, nuevo, "utf8");
  actualizados++;
}

console.log(`Comentarios añadidos: ${actualizados}`);
console.log(`Ya tenían comentario: ${omitidos}`);
console.log(`Total revisados: ${todos.length}`);
