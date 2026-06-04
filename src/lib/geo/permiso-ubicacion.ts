export type EstadoPermisoUbicacion =
  | "granted"
  | "prompt"
  | "denied"
  | "unsupported";

/** Estado del permiso de geolocalización (si el navegador lo expone). */
export async function consultarPermisoUbicacion(): Promise<EstadoPermisoUbicacion> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return "unsupported";
  }

  try {
    const permiso = await navigator.permissions.query({
      name: "geolocation" as PermissionName,
    });
    if (permiso.state === "granted") return "granted";
    if (permiso.state === "denied") return "denied";
    return "prompt";
  } catch {
    /* Safari / algunos navegadores no soportan Permissions API */
    return "prompt";
  }
}
