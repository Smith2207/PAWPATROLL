/**
 * Chat por avistamiento: mensaje.test.
 */
import { describe, expect, it } from "vitest";
import {
  etiquetaFechaChat,
  formatearHoraMensaje,
  mostrarSeparadorFecha,
} from "@/lib/chat/mensaje";

describe("etiquetaFechaChat", () => {
  it("formatea días que no son hoy ni ayer con día de la semana", () => {
    const fecha = new Date(2026, 5, 4, 12, 0, 0);
    const texto = etiquetaFechaChat(fecha);
    expect(texto.toLowerCase()).toContain("jueves");
    expect(texto).toContain("4");
    expect(texto.toLowerCase()).toContain("junio");
  });
});

describe("mostrarSeparadorFecha", () => {
  it("muestra separador en el primer mensaje", () => {
    const a = new Date(2026, 5, 6, 10, 0);
    expect(mostrarSeparadorFecha(a, undefined)).toBe(true);
  });

  it("muestra separador al cambiar de día", () => {
    const a = new Date(2026, 5, 6, 10, 0);
    const b = new Date(2026, 5, 5, 22, 0);
    expect(mostrarSeparadorFecha(a, b)).toBe(true);
  });

  it("no muestra separador en el mismo día", () => {
    const a = new Date(2026, 5, 6, 10, 0);
    const b = new Date(2026, 5, 6, 8, 0);
    expect(mostrarSeparadorFecha(a, b)).toBe(false);
  });
});

describe("formatearHoraMensaje", () => {
  it("usa formato 12h con a. m. / p. m.", () => {
    expect(formatearHoraMensaje(new Date(2026, 5, 6, 10, 2))).toMatch(/10:02.*a\. m\./);
    expect(formatearHoraMensaje(new Date(2026, 5, 6, 20, 1))).toMatch(/8:01.*p\. m\./);
  });
});
