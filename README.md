# PAWPATROLL

Landing + autenticación con **Neon PostgreSQL**, **Auth.js** y roles de usuario.

## Iniciar

```bash
copy .env.example .env.local   # Windows
pnpm install
pnpm db:push                   # crea tablas en Neon
pnpm dev
```

## Administrador único

Solo **paw.patrol.soporte@gmail.com** recibe el rol `ADMINISTRADOR` automáticamente (Google o correo).

Ese mismo correo envía los emails del sistema vía Gmail SMTP.

## Correos (verificación y bienvenida)

1. En Gmail `paw.patrol.soporte@gmail.com` activa **verificación en 2 pasos**.
2. Crea una **contraseña de aplicación** (16 caracteres).
3. En `.env.local`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=paw.patrol.soporte@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
EMAIL_FROM=PawPatrol <paw.patrol.soporte@gmail.com>
```

**Flujo:**
- Registro con correo → email de **verificación** con enlace.
- Tras verificar (o entrar con Google) → email de **bienvenida**.

### API verificar cuenta

| Método | Ruta | Uso |
|--------|------|-----|
| `GET` | `/api/auth/verificar-correo?token=...&email=...` | Enlace del correo (redirige al navegador) |
| `POST` | `/api/auth/verificar-cuenta` | Verificar con JSON (apps, Postman) |
| `GET` | `/api/auth/verificar-cuenta?email=...&token=...` | Verificar, respuesta JSON |
| `GET` | `/api/auth/verificar-cuenta?email=...&estado=1` | ¿Ya está verificado? |

Ejemplo POST:

```json
POST http://localhost:3000/api/auth/verificar-cuenta
Content-Type: application/json

{
  "email": "usuario@gmail.com",
  "token": "el_token_del_correo"
}
```

Respuesta OK:

```json
{
  "ok": true,
  "mensaje": "Cuenta verificada correctamente.",
  "email": "usuario@gmail.com",
  "verificado": true
}
```

Sin SMTP configurado, los enlaces se imprimen en la consola del servidor (`pnpm dev`).

## Variables de entorno (`.env.local`)

| Variable | Uso |
|----------|-----|
| `DATABASE_URL` | Connection string de Neon (pooled recomendado) |
| `AUTH_SECRET` | Secreto Auth.js (`openssl rand -base64 32`) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth Google |
| `SMTP_*` / `EMAIL_FROM` | Opcional: envío real de correos de verificación |

En desarrollo, el enlace de verificación se imprime en la consola del servidor.

## Módulo de autenticación

- **Registro** con correo y contraseña → `/registro`
- **Verificación de correo** (token en Neon, enlace por email o consola en dev)
- **Inicio de sesión** con correo o **Google OAuth 2.0** → `/iniciar-sesion`
- **Perfil** → `/perfil`
- **Mis mascotas** (ficha digital, fotos, estados) → `/mis-mascotas`
- **Ficha pública** (perdida / encontrada) → `/mascota/[slug]`

### Roles

| Rol | Permisos |
|-----|----------|
| `CIUDADANO` | Miembro: reportar pérdidas, avistamientos y registrar mascotas |
| `DUENO` | *(legado en BD; mismos permisos que CIUDADANO)* |
| `ADMINISTRADOR` | Gestión total (solo correo de soporte o asignación manual) |

Asignar administrador en Neon SQL Editor:

```sql
UPDATE "user" SET rol = 'ADMINISTRADOR' WHERE email = 'tu@correo.com';
```

## Módulo de mascotas

| Ruta | Descripción |
|------|-------------|
| `/mis-mascotas` | Listado de fichas |
| `/mis-mascotas/nueva` | Alta con datos y hasta 5 fotos |
| `/mis-mascotas/[id]` | Edición, cambio de estado e historial |
| `/mascota/[slug]` | Ficha pública (solo perdida o encontrada) |

Estados: `EN_CASA` → `PERDIDA` → `ENCONTRADA` → `REUNIDA` (con historial en Neon).

Tras actualizar el schema, en Neon SQL Editor ejecuta `drizzle/0002_modulo_mascotas.sql` o `pnpm db:push`.

## Estructura

```
auth.ts                    → Auth.js + Google + credenciales
src/lib/db/schema.ts       → Tablas Neon (user, account, session, mascota…)
src/actions/autenticacion.ts
src/actions/mascotas.ts
src/app/perfil/
src/app/mis-mascotas/
src/app/registro/
src/componentes/auth/
```

## Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → OAuth 2.0 Client ID.
2. URI de redirección: `http://localhost:3000/api/auth/callback/google`
3. Copia Client ID y Secret a `.env.local`.

## Neon

1. Crea proyecto en [neon.tech](https://neon.tech).
2. Copia la connection string a `DATABASE_URL`.
3. Ejecuta `pnpm db:push` o el SQL en `drizzle/0000_esquema_inicial.sql`.
