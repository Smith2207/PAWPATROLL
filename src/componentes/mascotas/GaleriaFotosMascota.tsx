"use client";



/**
 * [mascotas] Galería: fotos mascota.
 */
/**
 * [mascotas] Galería: fotos mascota.
 */
import { useRef } from "react";
import { Icono } from "@/componentes/ui/Icono";
import { ACCEPT_INPUT_IMAGEN } from "@/lib/imagen/validar-archivo";

type Props = {
  fotos: string[];
  maxFotos: number;
  error?: string | null;
  onQuitar: (indice: number) => void;
  onMarcarPrincipal: (indice: number) => void;
  onInputChange: (input: HTMLInputElement) => void;
  /** modal = estilo landing; ficha = zona de subida en mis-mascotas */
  variante?: "modal" | "ficha";
  titulo?: string;
  ayuda?: string;
};

export function GaleriaFotosMascota({
  fotos,
  maxFotos,
  error,
  onQuitar,
  onMarcarPrincipal,
  onInputChange,
  variante = "ficha",
  titulo,
  ayuda,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      {titulo && <div className="section-divider">{titulo}</div>}

      {ayuda && (
        <p className="form-ficha-ayuda" style={{ marginBottom: "0.75rem" }}>
          {ayuda}
        </p>
      )}

      {error && (
        <p
          className="auth-alerta auth-alerta--error"
          style={{ marginBottom: "0.75rem" }}
          role="alert"
        >
          {error}
        </p>
      )}

      {fotos.length > 0 && (
        <div className="galeria-fotos" style={{ marginBottom: "1rem" }}>
          {fotos.map((src, i) => (
            <div
              key={`${i}-${src.slice(0, 32)}`}
              className={`galeria-foto-item ${i === 0 ? "galeria-foto-item--principal" : ""}`}
            >
              <img src={src} alt={`Foto ${i + 1}`} />
              {i === 0 && <span className="galeria-foto-badge">Principal</span>}
              <div className="galeria-foto-acciones">
                {i !== 0 && (
                  <button
                    type="button"
                    title="Marcar como principal"
                    className="galeria-foto-btn galeria-foto-btn--estrella"
                    onClick={() => onMarcarPrincipal(i)}
                  >
                    <Icono nombre="estrella" size={14} />
                  </button>
                )}
                <button
                  type="button"
                  title="Quitar foto"
                  className="galeria-foto-btn galeria-foto-btn--quitar"
                  onClick={() => onQuitar(i)}
                >
                  <Icono nombre="cerrar" size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {fotos.length < maxFotos && (
        <>
          {variante === "modal" ? (
            <div
              className="photo-upload"
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) =>
                e.key === "Enter" && inputRef.current?.click()
              }
            >
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPT_INPUT_IMAGEN}
                multiple={maxFotos > 1}
                hidden
                onChange={(e) => onInputChange(e.target)}
              />
              <div className="photo-upload-icon">
                <Icono nombre="imagen" size={28} />
              </div>
              <div className="photo-upload-text">Elegir de galería</div>
            </div>
          ) : (
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
                accept={ACCEPT_INPUT_IMAGEN}
                multiple={maxFotos > 1}
                hidden
                onChange={(e) => onInputChange(e.target)}
              />
              <div style={{ marginBottom: 6 }}>
                <Icono nombre="camara" size={28} />
              </div>
              <div className="subir-fotos-zona-titulo">
                Subir fotos ({fotos.length}/{maxFotos})
              </div>
              <div className="subir-fotos-zona-ayuda">
                JPG, PNG o WebP. La primera foto es la principal.
              </div>
            </div>
          )}

          {variante === "modal" && (
            <p className="form-ficha-ayuda" style={{ marginTop: "0.5rem" }}>
              {fotos.length}/{maxFotos} fotos · JPG, PNG o WebP
            </p>
          )}
        </>
      )}
    </div>
  );
}
