# PawPatrol (PAWPATROLL)

Plataforma comunitaria para **reportar pérdidas**, **registrar avistamientos** y gestionar **fichas digitales de mascotas**. Incluye landing pública, autenticación (correo + Google), módulo de fichas con fotos y estados, y ficha pública compartible.

**Demo:** [pawpatroll.vercel.app](https://pawpatroll.vercel.app)

## Stack

- **Next.js 16** (App Router)
- **Auth.js** — sesión, Google OAuth, credenciales
- **Neon PostgreSQL** + **Drizzle ORM**
- **Vercel** — despliegue
- Estilos: paleta unificada (`paleta.css`), landing, auth, mascotas, responsive

## Inicio rápido

```bash
copy .env.example .env.local   # Windows
pnpm install
pnpm db:push                   # crea/actualiza tablas en Neon
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Variables de entorno (`.env.local`)

| Variable | Uso |
|----------|-----|
| `DATABASE_URL` | Connection string de Neon (pooled recomendado) |
| `AUTH_SECRET` | Secreto Auth.js (`openssl rand -base64 32`) |
| `NEXT_PUBLIC_APP_URL` | **Local:** `http://localhost:3000`. **Producción (Vercel):** `https://pawpatroll.vercel.app` — obligatorio para que los correos lleven enlaces correctos (verificación y recuperar contraseña). Sin esta variable en Vercel, los enlaces salen como `localhost`. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth Google |
| `SMTP_*` / `EMAIL_FROM` | Opcional: correos de verificación y bienvenida |

Sin SMTP, los enlaces de verificación se imprimen en la consola (`pnpm dev`).

## Administrador único

Solo **paw.patrol.soporte@gmail.com** recibe el rol `ADMINISTRADOR` automáticamente (Google o correo). Ese correo también envía los emails del sistema vía Gmail SMTP.

Asignar administrador manualmente en Neon:

```sql
UPDATE "user" SET rol = 'ADMINISTRADOR' WHERE email = 'tu@correo.com';
```

### Correos (Gmail SMTP)

1. Verificación en 2 pasos en la cuenta de soporte.
2. Contraseña de aplicación (16 caracteres).
3. En `.env.local`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=paw.patrol.soporte@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
EMAIL_FROM=PawPatrol <paw.patrol.soporte@gmail.com>
```

**Flujo:** registro → email de verificación → tras verificar (o Google) → email de bienvenida.

**Recuperar contraseña:** en login, «¿Olvidaste tu contraseña?» → correo con enlace (1 h) → nueva contraseña con bcrypt. No aplica a cuentas solo con Google. Sin SMTP, el enlace se imprime en la consola del servidor.

### API verificar cuenta

| Método | Ruta | Uso |
|--------|------|-----|
| `GET` | `/api/auth/verificar-correo?token=...&email=...` | Enlace del correo |
| `POST` | `/api/auth/verificar-cuenta` | JSON (Postman, apps) |
| `GET` | `/api/auth/verificar-cuenta?email=...&token=...` | Verificar, JSON |
| `GET` | `/api/auth/verificar-cuenta?email=...&estado=1` | ¿Ya verificado? |

## Rutas principales

### Públicas

| Ruta | Descripción |
|------|-------------|
| `/` | Landing: búsqueda, avistamientos, mascotas perdidas recientes |
| `/mascota/[slug]` | Ficha pública (solo `PERDIDA` o `ENCONTRADA`): fotos, datos, historial, CTA reportar avistamiento |
| `/iniciar-sesion` | Login (modal también desde la landing) |

### Con sesión

| Ruta | Descripción |
|------|-------------|
| `/registro` | Alta de cuenta con correo |
| `/verificar-correo` | Estado de verificación |
| `/recuperar-contrasena` | Solicitar enlace para restablecer contraseña (correo + contraseña) |
| `/restablecer-contrasena?email=...&token=...` | Elegir nueva contraseña (enlace del correo, válido 1 h) |
| `/perfil` | Datos de usuario y accesos rápidos |
| `/mis-mascotas` | Listado de **mis fichas** |
| `/mis-mascotas/ficha` | **Nueva ficha** (formulario en dos columnas: datos + fotos) |
| `/mis-mascotas/nueva` | Redirige a `/mis-mascotas/ficha` |
| `/mis-mascotas/[id]` | Editar ficha, cambiar estado, historial, eliminar |

### Navegación

- **Landing:** secciones ancla + enlace **Mis fichas** en el centro si hay sesión; derecha: chip de usuario, Salir, Reportar.
- **App** (`/mis-mascotas`, `/perfil`, ficha pública con barra): Inicio · Mis fichas · Mi perfil (activo resaltado) + acciones de usuario.
- **Modales globales** (login y reportar pérdida) en `layout.tsx` — funcionan en cualquier ruta, incluida la ficha pública.

## Módulo de fichas (mascotas)

- Terminología en UI: **ficha** (no «alta»).
- Formulario compacto: bloques *Lo esencial* / *Más detalles (opcional)*, grid 2 columnas y panel de fotos lateral (escritorio).
- Hasta **5 fotos** por ficha; carrusel y lightbox en ficha pública.
- **Estados:** `EN_CASA` → `PERDIDA` → `ENCONTRADA` → `REUNIDA`, con historial en Neon.

Tras cambios de schema:

```bash
pnpm db:push
```

O en Neon SQL Editor: `drizzle/0002_modulo_mascotas.sql`.

## Roles

| Rol | Permisos |
|-----|----------|
| `CIUDADANO` | Reportar pérdidas, avistamientos y gestionar sus fichas |
| `DUENO` | Legado en BD; mismos permisos que `CIUDADANO` |
| `ADMINISTRADOR` | Gestión total (correo de soporte o asignación manual) |

## Estructura del proyecto

```
auth.ts
src/
  app/
    page.tsx                    → Landing
    mis-mascotas/               → Listado, ficha nueva, edición
    mascota/[slug]/             → Ficha pública
    (app)/perfil, registro, verificar-correo
    api/auth/                   → Auth.js + verificación
  actions/
    autenticacion.ts
    mascotas.ts
  componentes/
    auth/                       → MenuUsuario, formularios
    landing/                    → BarraNavegacion, modales, secciones
    layout/                     → BarraNavegacionApp, EnvolturaPaginasApp
    mascotas/                   → FormularioFicha, FichaPublica, fotos…
  estilos/
    paleta.css, landing-pawpatrol.css, auth.css, mascotas.css, responsive.css
  lib/db/schema.ts              → Drizzle (user, mascota, fotos, historial…)
drizzle/                        → Migraciones SQL
```

## Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → OAuth 2.0 Client ID.
2. URI de redirección: `http://localhost:3000/api/auth/callback/google` (y la URL de producción en Vercel).
3. Variables `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` en `.env.local` y en Vercel.

## Neon

1. Proyecto en [neon.tech](https://neon.tech).
2. `DATABASE_URL` en `.env.local` y en Vercel.
3. `pnpm db:push` o SQL en `drizzle/0000_esquema_inicial.sql`.

## Despliegue (Vercel)

1. Conectar el repositorio de GitHub.
2. Añadir las mismas variables de entorno que en `.env.local`, sobre todo `NEXT_PUBLIC_APP_URL=https://pawpatroll.vercel.app` (no dejar el valor de localhost).
3. Redesplegar tras cambiar variables.
4. Tras el deploy, ejecutar migraciones en Neon si la BD de producción está vacía.

---

Repositorio: [github.com/Smith2207/PAWPATROLL](https://github.com/Smith2207/PAWPATROLL)
