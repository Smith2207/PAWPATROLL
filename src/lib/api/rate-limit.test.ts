import { describe, expect, it } from "vitest";
import { rateLimit } from "@/lib/api/rate-limit";

describe("rateLimit", () => {
  it("permite solicitudes dentro del límite", () => {
    const clave = `test-ok-${Date.now()}`;
    expect(rateLimit(clave, 3, 60_000).ok).toBe(true);
    expect(rateLimit(clave, 3, 60_000).ok).toBe(true);
    expect(rateLimit(clave, 3, 60_000).ok).toBe(true);
  });

  it("bloquea al superar el límite", () => {
    const clave = `test-block-${Date.now()}`;
    rateLimit(clave, 2, 60_000);
    rateLimit(clave, 2, 60_000);
    const tercera = rateLimit(clave, 2, 60_000);
    expect(tercera.ok).toBe(false);
    if (!tercera.ok) {
      expect(tercera.reintentarEnSeg).toBeGreaterThan(0);
    }
  });
});
