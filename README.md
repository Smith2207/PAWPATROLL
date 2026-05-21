# PAWPATROLL

Landing + autenticación con **Neon PostgreSQL**, **Auth.js** y roles de usuario.

## Iniciar

```bash
cd paw
copy .env.example .env.local   # Windows
pnpm db:push                   # crea tablas en Neon
pnpm dev
```

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
- **Mis mascotas** (rol Dueño o Admin) → `/mis-mascotas`

### Roles

| Rol | Permisos |
|-----|----------|
| `CIUDADANO` | Avistamientos, uso general |
| `DUENO` | + registrar mascotas en su perfil |
| `ADMINISTRADOR` | Gestión total (asignar en Neon) |

Asignar administrador en Neon SQL Editor:

```sql
UPDATE "user" SET rol = 'ADMINISTRADOR' WHERE email = 'tu@correo.com';
```

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
