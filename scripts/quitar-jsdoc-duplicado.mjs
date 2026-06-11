#!/usr/bin/env node
/**
 * Elimina bloques JSDoc consecutivos idénticos (artefacto de re-ejecutar agregar-comentarios).
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const RAIZ = join(import.meta.dirname, "..", "src");

function recorrer(dir, archivos = []) {
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) {
      recorrer(ruta, archivos);
    } else if (/\.(ts|tsx)$/.test(nombre)) {
      archivos.push(ruta);
    }
  }
  return archivos;
}

function quitarDuplicados(contenido) {
  return contenido.replace(/(\/\*\*[\s\S]*?\*\/)(\s*\1)+/g, "$1");
}

let tocados = 0;
for (const ruta of recorrer(RAIZ)) {
  const original = readFileSync(ruta, "utf8");
  const limpio = quitarDuplicados(original);
  if (limpio !== original) {
    writeFileSync(ruta, limpio);
    tocados += 1;
  }
}

console.log(`JSDoc duplicado eliminado en ${tocados} archivos.`);
