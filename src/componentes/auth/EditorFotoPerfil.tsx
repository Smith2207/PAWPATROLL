"use client";

import { actualizarImagenPerfil } from "@/actions/autenticacion";
import {
  ACCEPT_INPUT_IMAGEN,
  MENSAJE_IMAGEN_ILEGIBLE,
  validarArchivoImagen,
} from "@/lib/imagen/validar-archivo";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Props = {
  imagenInicial: string | null;
  iniciales: string;
  nombre: string;
};

function leerArchivo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function EditorFotoPerfil({ imagenInicial, iniciales, nombre }: Props) {
  const router = useRouter();
  const { update } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const [imagen, setImagen] = useState<string | null>(imagenInicial);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    if (!menuAbierto) return;

    function cerrarSiFuera(e: MouseEvent) {
      if (
        contenedorRef.current &&
        !contenedorRef.current.contains(e.target as Node)
      ) {
        setMenuAbierto(false);
      }
    }

    function cerrarConEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuAbierto(false);
    }

    document.addEventListener("mousedown", cerrarSiFuera);
    document.addEventListener("keydown", cerrarConEscape);
    return () => {
      document.removeEventListener("mousedown", cerrarSiFuera);
      document.removeEventListener("keydown", cerrarConEscape);
    };
  }, [menuAbierto]);

  async function guardarImagen(dataUrl: string | null) {
    setCargando(true);
    setError(null);
    setMensaje(null);
    setMenuAbierto(false);

    const resultado = await actualizarImagenPerfil(dataUrl);
    setCargando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    setImagen(dataUrl);
    setMensaje(resultado.mensaje);
    await update();
    router.refresh();
  }

  async function elegirArchivo() {
    const archivo = inputRef.current?.files?.[0];
    if (!archivo) return;

    const validacion = validarArchivoImagen(archivo, {
      maxBytes: 4 * 1024 * 1024,
    });
    if (!validacion.ok) {
      setError(validacion.error);
      inputRef.current!.value = "";
      return;
    }

    try {
      const dataUrl = await leerArchivo(archivo);
      await guardarImagen(dataUrl);
    } catch {
      setError(MENSAJE_IMAGEN_ILEGIBLE);
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function abrirSelector() {
    setMenuAbierto(false);
    inputRef.current?.click();
  }

  return (
    <div className="perfil-avatar-editor" ref={contenedorRef}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_INPUT_IMAGEN}
        hidden
        onChange={elegirArchivo}
        aria-label="Elegir foto de perfil"
      />

      <button
        type="button"
        className="perfil-avatar-disparador"
        onClick={() => setMenuAbierto((v) => !v)}
        disabled={cargando}
        aria-haspopup="menu"
        aria-expanded={menuAbierto}
        aria-label="Opciones de foto de perfil"
        title="Opciones de foto"
      >
        {imagen ? (
          <img
            src={imagen}
            alt={`Foto de ${nombre}`}
            width={96}
            height={96}
            className="perfil-avatar"
          />
        ) : (
          <span className="perfil-avatar perfil-avatar--iniciales" aria-hidden>
            {iniciales}
          </span>
        )}
        {cargando && <span className="perfil-avatar-cargando" aria-hidden />}
      </button>

      {menuAbierto && (
        <div className="perfil-avatar-menu" role="menu">
          <button type="button" role="menuitem" onClick={abrirSelector}>
            Cambiar foto
          </button>
          {imagen && (
            <button
              type="button"
              role="menuitem"
              className="perfil-avatar-menu-item--peligro"
              onClick={() => guardarImagen(null)}
            >
              Quitar foto
            </button>
          )}
        </div>
      )}

      {(error || mensaje) && (
        <p
          className={`perfil-avatar-aviso ${error ? "perfil-avatar-aviso--error" : "perfil-avatar-aviso--ok"}`}
          role="status"
        >
          {error ?? mensaje}
        </p>
      )}
    </div>
  );
}
