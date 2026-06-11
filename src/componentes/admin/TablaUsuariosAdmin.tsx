"use client";



/**
 * [admin] Componente React: tabla usuarios admin.
 */
/**
 * [admin] Componente React: tabla usuarios admin.
 */
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  alternarUsuarioActivo,
  listarUsuariosAdmin,
  type UsuarioAdmin,
} from "@/actions/admin";
import { Icono } from "@/componentes/ui/Icono";

type Props = {
  usuariosIniciales: UsuarioAdmin[];
};

export function TablaUsuariosAdmin({ usuariosIniciales }: Props) {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState(usuariosIniciales);
  const [busqueda, setBusqueda] = useState("");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  function buscar(e: React.FormEvent) {
    e.preventDefault();
    setMensaje(null);
    setError(null);
    startTransition(async () => {
      try {
        const lista = await listarUsuariosAdmin(busqueda);
        setUsuarios(lista);
      } catch {
        setError("No se pudo buscar usuarios.");
      }
    });
  }

  function alternarActivo(userId: string) {
    setMensaje(null);
    setError(null);
    startTransition(async () => {
      try {
        const resultado = await alternarUsuarioActivo(userId);
        if (!resultado.ok) {
          setError(resultado.error);
          return;
        }
        setMensaje(resultado.mensaje ?? "Actualizado.");
        const lista = await listarUsuariosAdmin(busqueda);
        setUsuarios(lista);
        router.refresh();
      } catch {
        setError("No se pudo cambiar el estado de la cuenta.");
      }
    });
  }

  return (
    <>
      <form className="admin-busqueda" onSubmit={buscar}>
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por correo o nombre…"
          className="admin-input-busqueda"
        />
        <button type="submit" className="admin-btn admin-btn--primario" disabled={pendiente}>
          <Icono nombre="buscar" size={14} />
          Buscar
        </button>
      </form>

      {mensaje && <p className="admin-flash admin-flash--ok">{mensaje}</p>}
      {error && <p className="admin-flash admin-flash--error">{error}</p>}

      <div className="admin-tabla-wrap">
        <table className="admin-tabla">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Mascotas</th>
              <th>Avistamientos</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 ? (
              <tr>
                <td colSpan={7} className="admin-vacio-celda">
                  No hay usuarios que coincidan.
                </td>
              </tr>
            ) : (
              usuarios.map((u) => (
                <tr key={u.id}>
                  <td>{u.name ?? "—"}</td>
                  <td>{u.email}</td>
                  <td>{u.rol === "ADMINISTRADOR" ? "Administrador" : "Usuario"}</td>
                  <td className="admin-tabla-num">{u.totalMascotas}</td>
                  <td className="admin-tabla-num">{u.totalAvistamientos}</td>
                  <td>
                    <span
                      className={`admin-badge ${
                        u.activo ? "admin-badge--ok" : "admin-badge--alerta"
                      }`}
                    >
                      {u.activo ? "Activa" : "Desactivada"}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`admin-btn ${u.activo ? "admin-btn--alerta" : "admin-btn--ok"}`}
                      disabled={pendiente}
                      onClick={() => alternarActivo(u.id)}
                    >
                      {u.activo ? "Desactivar" : "Reactivar"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
