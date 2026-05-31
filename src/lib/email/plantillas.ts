import { urlBaseApp } from "@/lib/url-app";

function escaparHtml(texto: string) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Botón con enlace oculto (sin URL visible en el cuerpo del correo). */
function botonCorreo(
  href: string,
  etiqueta: string,
  color: "#E87C2A" | "#2E6DB4" = "#E87C2A"
) {
  const url = escaparHtml(href);
  const texto = escaparHtml(etiqueta);

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:24px auto;">
      <tr>
        <td align="center" style="border-radius:50px;background:${color};">
          <a href="${url}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:13px 28px;font-family:Nunito,Arial,sans-serif;font-size:15px;font-weight:800;color:#ffffff;text-decoration:none;border-radius:50px;line-height:1.2;">
            ${texto}
          </a>
        </td>
      </tr>
    </table>
  `;
}

function layout(titulo: string, cuerpo: string) {
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><title>${escaparHtml(titulo)}</title></head>
<body style="font-family:Nunito,Arial,sans-serif;background:#F5F7FA;padding:24px;color:#1A3C6E;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;border:1px solid #E2EAF8;">
    <div style="font-size:1.5rem;font-weight:800;margin-bottom:8px;">🐾 PawPatrol</div>
    ${cuerpo}
    <p style="margin-top:24px;font-size:0.75rem;color:#4A5568;">
      Soporte: <a href="mailto:paw.patrol.soporte@gmail.com" style="color:#2E6DB4;text-decoration:none;font-weight:700;">paw.patrol.soporte@gmail.com</a>
    </p>
  </div>
</body>
</html>`;
}

export function plantillaVerificacion(nombre: string, enlace: string) {
  return layout(
    "Verifica tu correo",
    `
    <h2 style="margin:0 0 12px;font-size:1.2rem;">Hola${nombre ? `, ${escaparHtml(nombre)}` : ""}</h2>
    <p style="line-height:1.6;">Gracias por registrarte en PawPatrol. Confirma tu correo para activar tu cuenta:</p>
    ${botonCorreo(enlace, "Verificar mi correo")}
    <p style="font-size:0.85rem;color:#4A5568;">Haz clic en el botón naranja de arriba. El acceso expira en 24 horas. Si no creaste esta cuenta, ignora este mensaje.</p>
  `
  );
}

export function plantillaRecuperarContrasena(nombre: string, enlace: string) {
  return layout(
    "Restablecer contraseña",
    `
    <h2 style="margin:0 0 12px;font-size:1.2rem;">Hola${nombre ? `, ${escaparHtml(nombre)}` : ""}</h2>
    <p style="line-height:1.6;">Recibimos una solicitud para restablecer la contraseña de tu cuenta en PawPatrol. Si fuiste tú, usa el botón:</p>
    ${botonCorreo(enlace, "Elegir nueva contraseña")}
    <p style="font-size:0.85rem;color:#4A5568;">Haz clic en el botón naranja de arriba. El acceso expira en 1 hora. Si no pediste este cambio, ignora este mensaje; tu contraseña actual seguirá igual.</p>
  `
  );
}

export function plantillaAvistamientoNuevo(opciones: {
  nombreDueno: string | null;
  nombreMascota: string;
  numeroReporte: number;
  direccion: string | null;
  enlace: string;
}) {
  const lugar = escaparHtml(opciones.direccion?.trim() || "Ubicación en el mapa");
  return layout(
    "Nuevo avistamiento",
    `
    <h2 style="margin:0 0 12px;font-size:1.2rem;">Hola${opciones.nombreDueno ? `, ${escaparHtml(opciones.nombreDueno)}` : ""}</h2>
    <p style="line-height:1.6;">Alguien reportó el <strong>avistamiento #${opciones.numeroReporte}</strong> de <strong>${escaparHtml(opciones.nombreMascota)}</strong>.</p>
    <p style="line-height:1.6;"><strong>Lugar:</strong> ${lugar}</p>
    ${botonCorreo(opciones.enlace, "Ver avistamiento en PawPatrol")}
    <p style="font-size:0.85rem;color:#4A5568;">Puedes verificar el reporte y chatear con quien lo envió desde la línea de tiempo de avistamientos.</p>
  `
  );
}

export function plantillaMensajeChatAvistamiento(opciones: {
  nombreDestino: string | null;
  nombreMascota: string;
  autorMensaje: string;
  extracto: string;
  enlace: string;
}) {
  return layout(
    "Nuevo mensaje",
    `
    <h2 style="margin:0 0 12px;font-size:1.2rem;">Hola${opciones.nombreDestino ? `, ${escaparHtml(opciones.nombreDestino)}` : ""}</h2>
    <p style="line-height:1.6;"><strong>${escaparHtml(opciones.autorMensaje)}</strong> escribió sobre <strong>${escaparHtml(opciones.nombreMascota)}</strong>:</p>
    <blockquote style="margin:16px 0;padding:12px 16px;background:#F5F7FA;border-left:4px solid #2E6DB4;border-radius:8px;font-size:0.95rem;">
      ${escaparHtml(opciones.extracto)}
    </blockquote>
    ${botonCorreo(opciones.enlace, "Responder en PawPatrol", "#2E6DB4")}
  `
  );
}

export function plantillaBienvenida(nombre: string, rolEtiqueta: string) {
  return layout(
    "Bienvenido a PawPatrol",
    `
    <h2 style="margin:0 0 12px;font-size:1.2rem;">¡Bienvenido${nombre ? `, ${escaparHtml(nombre)}` : ""}!</h2>
    <p style="line-height:1.6;">Tu cuenta en PawPatrol está activa${rolEtiqueta === "Administrador" ? ` (<strong>${escaparHtml(rolEtiqueta)}</strong>)` : ""}.</p>
    <p style="line-height:1.6;">Puedes reportar mascotas perdidas, registrar avistamientos, guardar el perfil de tus mascotas y ayudar a reunir familias.</p>
    ${botonCorreo(`${urlBaseApp()}/perfil`, "Ir a mi perfil", "#2E6DB4")}
  `
  );
}
