import { describe, expect, it } from "vitest";
import { puedeAccederCentroCoordinacion } from "@/lib/mascotas/estados";

describe("puedeAccederCentroCoordinacion", () => {
  it("permite PERDIDA y ENCONTRADA sin avistamientos", () => {
    expect(puedeAccederCentroCoordinacion("PERDIDA", 0)).toBe(true);
    expect(puedeAccederCentroCoordinacion("ENCONTRADA", 0)).toBe(true);
  });

  it("permite REUNIDA o EN_CASA si hay avistamientos", () => {
    expect(puedeAccederCentroCoordinacion("REUNIDA", 2)).toBe(true);
    expect(puedeAccederCentroCoordinacion("EN_CASA", 1)).toBe(true);
  });

  it("bloquea REUNIDA o EN_CASA sin avistamientos", () => {
    expect(puedeAccederCentroCoordinacion("REUNIDA", 0)).toBe(false);
    expect(puedeAccederCentroCoordinacion("EN_CASA", 0)).toBe(false);
  });
});
