"use client";

import { useRef } from "react";
import { Icono } from "@/componentes/ui/Icono";

const MAX_FOTOS = 5;

function leerArchivo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type Props = {
  fotos: string[];
  onFotosChange: (fotos: string[]) => void;
};

export function SubirFotosMascota({ fotos, onFotosChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function agregarArchivos() {
    if (!inputRef.current?.files?.length) return;
    const restantes = MAX_FOTOS - fotos.length;
    if (restantes <= 0) return;

    const archivos = Array.from(inputRef.current.files).slice(0, restantes);
    const nuevas = await Promise.all(archivos.map(leerArchivo));
    onFotosChange([...fotos, ...nuevas].slice(0, MAX_FOTOS));
    inputRef.current.value = "";
  }

  function quitar(indice: number) {
    onFotosChange(fotos.filter((_, i) => i !== indice));
  }

  function marcarPrincipal(indice: number) {
    const copia = [...fotos];
    const [foto] = copia.splice(indice, 1);
    if (!foto) return;
    onFotosChange([foto, ...copia]);
  }

  return (
    <div>
      {fotos.length > 0 && (
        <div className="galeria-fotos" style={{ marginBottom: "1rem" }}>
          {fotos.map((src, i) => (
            <div
              key={`${i}-${src.slice(0, 32)}`}
              className={`galeria-foto-item ${i === 0 ? "galeria-foto-item--principal" : ""}`}
            >
              <img src={src} alt={`Foto ${i + 1}`} />
              {i === 0 && <span className="galeria-foto-badge">Principal</span>}
              <div
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  display: "flex",
                  gap: 4,
                }}
              >
                {i !== 0 && (
                  <button
                    type="button"
                    title="Marcar como principal"
                    onClick={() => marcarPrincipal(i)}
                    style={{
                      background: "rgba(255,255,255,0.9)",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: "0.65rem",
                      padding: "2px 5px",
                    }}
                  >
                    <Icono nombre="estrella" size={14} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => quitar(i)}
                  style={{
                    background: "rgba(0,0,0,0.55)",
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    width: 22,
                    height: 22,
                    cursor: "pointer",
                  }}
                >
                  <Icono nombre="cerrar" size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {fotos.length < MAX_FOTOS && (
        <div
          className="subir-fotos-zona"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={agregarArchivos}
          />
          <div style={{ marginBottom: 6 }}>
            <Icono nombre="camara" size={28} />
          </div>
          <div style={{ fontWeight: 800, color: "var(--navy)", fontSize: "0.85rem" }}>
            Subir fotos ({fotos.length}/{MAX_FOTOS})
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 4 }}>
            JPG o PNG. La primera foto es la principal.
          </div>
        </div>
      )}
    </div>
  );
}
