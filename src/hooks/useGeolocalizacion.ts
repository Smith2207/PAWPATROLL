"use client";

import { useCallback } from "react";

export function useGeolocalizacion() {
  const usarMiUbicacion = useCallback(
    (
      input: HTMLInputElement | null,
      boton: HTMLButtonElement | null
    ) => {
      if (!input || !boton) return;

      if (!navigator.geolocation) {
        alert("Tu navegador no soporta geolocalización.");
        return;
      }

      boton.textContent = "⏳ Obteniendo...";

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          input.value = `Lat: ${pos.coords.latitude.toFixed(5)}, Lng: ${pos.coords.longitude.toFixed(5)} (Puno)`;
          boton.textContent = "✅ Ubicación obtenida";
          boton.style.color = "var(--mint)";
          boton.style.borderColor = "var(--mint)";
        },
        () => {
          input.value = "Puno, Perú (ubicación aproximada)";
          boton.textContent = "📍 Ubicación manual";
        }
      );
    },
    []
  );

  return { usarMiUbicacion };
}
