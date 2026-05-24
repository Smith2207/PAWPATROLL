import { urlBaseApp } from "@/lib/url-app";

function layout(titulo: string, cuerpo: string) {
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><title>${titulo}</title></head>
<body style="font-family:Nunito,Arial,sans-serif;background:#F5F7FA;padding:24px;color:#1A3C6E;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;border:1px solid #E2EAF8;">
    <div style="font-size:1.5rem;font-weight:800;margin-bottom:8px;">🐾 PawPatrol</div>
    ${cuerpo}
    <p style="margin-top:24px;font-size:0.75rem;color:#4A5568;">
      Soporte: <a href="mailto:paw.patrol.soporte@gmail.com">paw.patrol.soporte@gmail.com</a>
    </p>
  </div>
</body>
</html>`;
}

export function plantillaVerificacion(nombre: string, enlace: string) {
  return layout(
    "Verifica tu correo",
    `
    <h2 style="margin:0 0 12px;font-size:1.2rem;">Hola${nombre ? `, ${nombre}` : ""}</h2>
    <p style="line-height:1.6;">Gracias por registrarte en PawPatrol. Confirma tu correo para activar tu cuenta:</p>
    <p style="text-align:center;margin:24px 0;">
      <a href="${enlace}" style="background:#E87C2A;color:#fff;text-decoration:none;padding:12px 24px;border-radius:50px;font-weight:800;display:inline-block;">
        Verificar mi correo
      </a>
    </p>
    <p style="font-size:0.85rem;color:#4A5568;">El enlace expira en 24 horas. Si no creaste esta cuenta, ignora este mensaje.</p>
    <p style="font-size:0.8rem;word-break:break-all;color:#505A6B;">${enlace}</p>
  `
  );
}

export function plantillaRecuperarContrasena(nombre: string, enlace: string) {
  return layout(
    "Restablecer contraseña",
    `
    <h2 style="margin:0 0 12px;font-size:1.2rem;">Hola${nombre ? `, ${nombre}` : ""}</h2>
    <p style="line-height:1.6;">Recibimos una solicitud para restablecer la contraseña de tu cuenta en PawPatrol. Si fuiste tú, usa este enlace:</p>
    <p style="text-align:center;margin:24px 0;">
      <a href="${enlace}" style="background:#E87C2A;color:#fff;text-decoration:none;padding:12px 24px;border-radius:50px;font-weight:800;display:inline-block;">
        Elegir nueva contraseña
      </a>
    </p>
    <p style="font-size:0.85rem;color:#4A5568;">El enlace expira en 1 hora. Si no pediste este cambio, ignora este mensaje; tu contraseña actual seguirá igual.</p>
    <p style="font-size:0.8rem;word-break:break-all;color:#505A6B;">${enlace}</p>
  `
  );
}

export function plantillaBienvenida(nombre: string, rolEtiqueta: string) {
  return layout(
    "Bienvenido a PawPatrol",
    `
    <h2 style="margin:0 0 12px;font-size:1.2rem;">¡Bienvenido${nombre ? `, ${nombre}` : ""}!</h2>
    <p style="line-height:1.6;">Tu cuenta en PawPatrol está activa${rolEtiqueta === "Administrador" ? ` (<strong>${rolEtiqueta}</strong>)` : ""}.</p>
    <p style="line-height:1.6;">Puedes reportar mascotas perdidas, registrar avistamientos, guardar el perfil de tus mascotas y ayudar a reunir familias.</p>
    <p style="text-align:center;margin:24px 0;">
      <a href="${urlBaseApp()}/perfil" style="background:#2E6DB4;color:#fff;text-decoration:none;padding:12px 24px;border-radius:50px;font-weight:800;display:inline-block;">
        Ir a mi perfil
      </a>
    </p>
  `
  );
}
