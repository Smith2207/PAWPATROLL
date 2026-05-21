"use client";

const OFFSET_NAV = 76;

export function irASeccion(id: string) {
  const elemento = document.getElementById(id);
  if (!elemento) return;

  const top =
    elemento.getBoundingClientRect().top + window.scrollY - OFFSET_NAV;

  window.scrollTo({ top, behavior: "smooth" });
  window.history.replaceState(null, "", `#${id}`);
}
