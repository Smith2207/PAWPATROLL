"use client";

import { obtenerImagenPerfilSesion } from "@/actions/autenticacion";
import { useModales } from "@/contexto/ContextoModales";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  enMenuMovil?: boolean;
  /** En barra app: sin enlaces duplicados (ya están en el centro) */
  compacto?: boolean;
};

function inicialUsuario(nombre?: string | null, correo?: string | null) {
  const base = (nombre ?? correo ?? "?").trim();
  return base.charAt(0).toUpperCase();
}

function AvatarUsuario({
  imagenSesion,
  nombre,
  correo,
  sesionActiva,
}: {
  imagenSesion?: string | null;
  nombre?: string | null;
  correo?: string | null;
  sesionActiva: boolean;
}) {
  const inicial = inicialUsuario(nombre, correo);
  const [imagen, setImagen] = useState<string | null>(imagenSesion ?? null);

  useEffect(() => {
    if (!sesionActiva) {
      setImagen(null);
      return;
    }

    if (imagenSesion?.startsWith("http")) {
      setImagen(imagenSesion);
      return;
    }

    let activo = true;

    obtenerImagenPerfilSesion().then((url) => {
      if (activo) setImagen(url);
    });

    return () => {
      activo = false;
    };
  }, [sesionActiva, imagenSesion]);

  if (imagen) {
    return (
      <img
        src={imagen}
        alt=""
        width={32}
        height={32}
        className="nav-usuario-foto"
      />
    );
  }

  return (
    <span className="nav-usuario-inicial" aria-hidden>
      {inicial}
    </span>
  );
}

export function MenuUsuario({ enMenuMovil = false, compacto = false }: Props) {
  const { data: sesion, status } = useSession();
  const { abrirModal } = useModales();
  const pathname = usePathname();
  const enPerfil = pathname.startsWith("/perfil");

  const claseContenedor = enMenuMovil
    ? "nav-usuario nav-usuario--movil"
    : compacto
      ? "nav-usuario nav-usuario--compacto"
      : "nav-usuario";

  if (status === "loading") {
    return (
      <span className="nav-usuario-cargando" aria-hidden>
        …
      </span>
    );
  }

  if (!sesion?.user) {
    return (
      <div className={claseContenedor}>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => abrirModal("login")}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          className="btn-orange-nav"
          onClick={() => abrirModal("report")}
        >
          <span className="nav-cta-icono" aria-hidden>
            🚨
          </span>
          <span className="nav-cta-texto">Perdí mi mascota</span>
        </button>
      </div>
    );
  }

  const nombre = sesion.user.name ?? sesion.user.email?.split("@")[0] ?? "Cuenta";

  const chipUsuario = enPerfil ? (
    <span
      className={`nav-usuario-chip nav-usuario-chip--actual${enMenuMovil ? " nav-usuario-chip--bloque" : ""}`}
      title="Estás en tu perfil"
    >
      <AvatarUsuario
        imagenSesion={sesion.user.image}
        nombre={sesion.user.name}
        correo={sesion.user.email}
        sesionActiva
      />
      <span className="nav-usuario-nombre">{nombre}</span>
    </span>
  ) : (
    <Link
      href="/perfil"
      className={`nav-usuario-chip${enMenuMovil ? " nav-usuario-chip--bloque" : ""}`}
      title="Mi perfil"
    >
      <AvatarUsuario
        imagenSesion={sesion.user.image}
        nombre={sesion.user.name}
        correo={sesion.user.email}
        sesionActiva
      />
      <span className="nav-usuario-nombre">{nombre}</span>
    </Link>
  );

  if (enMenuMovil) {
    return (
      <div className={claseContenedor}>
        {chipUsuario}
        <button
          type="button"
          className="btn-ghost"
          onClick={() => signOut({ redirectTo: "/" })}
        >
          Cerrar sesión
        </button>
        <button
          type="button"
          className="btn-orange-nav"
          onClick={() => abrirModal("report")}
        >
          <span className="nav-cta-icono" aria-hidden>
            🚨
          </span>
          <span className="nav-cta-texto">Perdí mi mascota</span>
        </button>
      </div>
    );
  }

  return (
    <div className={claseContenedor}>
      {chipUsuario}
      <button
        type="button"
        className="btn-ghost btn-ghost--nav-salir"
        onClick={() => signOut({ redirectTo: "/" })}
        title="Cerrar sesión"
      >
        Salir
      </button>
      <button
        type="button"
        className="btn-orange-nav btn-orange-nav--nav"
        onClick={() => abrirModal("report")}
        title="Reportar mascota perdida"
      >
        <span className="nav-cta-icono" aria-hidden>
          🚨
        </span>
        <span className="nav-cta-texto">Perdí</span>
      </button>
    </div>
  );
}
