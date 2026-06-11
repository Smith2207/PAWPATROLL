# PawPatrol (PAWPATROLL)

Plataforma comunitaria para **reportar pérdidas**, **registrar avistamientos** y gestionar **fichas digitales de mascotas**. Incluye landing pública, autenticación (correo + Google), módulo de fichas con fotos y estados, y ficha pública compartible.

**Demo:** [pawpatroll.vercel.app](https://pawpatroll.vercel.app)

> **Documentación del sistema (entrega académica):** [docs/DOCUMENTACION_DEL_SISTEMA.md](./docs/DOCUMENTACION_DEL_SISTEMA.md) — visión, arquitectura, BD, API, pruebas, seguridad y operación. **Word:** [docs/Documentacion_del_Sistema_PawPatrol.docx](./docs/Documentacion_del_Sistema_PawPatrol.docx) (`python3 scripts/md-a-word.py` para regenerar). **Lógica de actores:** [docs/MODELO-ACTORES-Y-PERMISOS.md](./docs/MODELO-ACTORES-Y-PERMISOS.md).

> **Documentación de módulos:** ver [README-MODULOS.md](./README-MODULOS.md) — referencia completa **M1 a M7** (métodos, rutas, APIs y librerías).

> **Migraciones BD:** [docs/MIGRACIONES.md](./docs/MIGRACIONES.md) · **Deploy y rutas legacy:** [docs/DEPLOY-Y-RUTAS.md](./docs/DEPLOY-Y-RUTAS.md) · **OpenAPI:** [docs/openapi.yaml](./docs/openapi.yaml)

## Stack

- **Next.js 16** (App Router)
- **Auth.js** — sesión, Google OAuth, credenciales
- **Neon PostgreSQL** + **Drizzle ORM**
- **Vercel** — despliegue
- Estilos: paleta, landing, auth, mascotas, mapa, visual, admin
- **Mapa** (Leaflet): comunidad + ficha individual, calor, cercos, refugios (M5)
- **Búsqueda por foto** (Gemini Flash + Embedding 2, 768d; respaldo CLIP)
- **WebSocket** opcional en desarrollo (`WS_PORT` / `NEXT_PUBLIC_WS_PORT`)

## Inicio rápido

```bash
copy .env.example .env.local   # Windows
npm install
npm run db:push                   # crea/actualiza tablas en Neon
npm run db:migrate-mapa           # si usas módulo mapa (0004+)
npm run db:migrate-embeddings
npm run db:migrate-embeddings-multifoto
npm run db:migrate-comportamiento
npm run db:migrate-acceso-exterior   # campo acceso_exterior para M5
npm run db:migrate-gemini-768        # embeddings 768d (0009)
npm run db:migrate-notificaciones    # notificaciones + lecturas chat (0010)
npm run db:migrate-usuario-activo    # usuario activo (0011)
npm run db:migrate-chat-adjunto      # adjuntos chat en blob (0012)
npm run db:migrate-roles             # roles USUARIO / ADMINISTRADOR (0013)
npm run test
npm run dev
```

El servidor de desarrollo levanta Next en `:3000` y, vía `instrumentation.ts`, un WebSocket en `:3001` para actualizar mapa y avistamientos.

Abre [http://localhost:3000](http://localhost:3000).

## Variables de entorno (`.env.local`)

| Variable | Uso |
|----------|-----|
| `DATABASE_URL` | Connection string de Neon (pooled recomendado) |
| `AUTH_SECRET` | Secreto Auth.js (`openssl rand -base64 32`) |
| `NEXT_PUBLIC_APP_URL` | **Local:** `http://localhost:3000`. **Producción (Vercel):** `https://pawpatroll.vercel.app` — obligatorio para que los correos lleven enlaces correctos (verificación y recuperar contraseña). Sin esta variable en Vercel, los enlaces salen como `localhost`. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth Google |
| `SMTP_*` / `EMAIL_FROM` | Correos de verificación, bienvenida y aviso al dueño |
| `WS_PORT` / `NEXT_PUBLIC_WS_PORT` | WebSocket local (por defecto `3001`) |
| `NEXT_PUBLIC_WS_URL` / `WS_PUBLISH_*` | Tiempo real en producción (Railway); ver `docs/TIEMPO-REAL-VERCEL.md` |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob: adjuntos de chat (privado) y fotos de ficha nuevas (público) |
| `GOOGLE_CLOUD_PROJECT` + ADC (o JSON en Vercel) | Búsqueda por foto Vertex (ver `.env.example`) |
| `VISUAL_*` / `CLIP_*` | Umbrales y proveedor (`gemini` \| `clip`) |

Sin SMTP, los enlaces de verificación se imprimen en la consola (`npm run dev`).

Tras marcar mascotas como **PERDIDA** con fotos, indexa embeddings: `npm run db:reindexar-visual`.

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

**Avistamientos:** el reporte siempre se guarda en la base de datos. Si `SMTP_PASS` falla (p. ej. error 535 de Gmail), revisa que sea contraseña de aplicación sin espacios extra. Sin SMTP, el dueño verá un aviso en **Mis mascotas** y debe revisar la ficha en la web.

### Tiempo real (mapa y chat)

- **Local:** `npm run dev` (WebSocket en `:3001`).
- **Vercel sin complemento:** no uses `https://pawpatroll.vercel.app` como `NEXT_PUBLIC_WS_URL`. Chat ~8 s, mapa ~90 s.
- **Vercel + tiempo real instantáneo:** despliega solo **`services/pawpatroll-ws`** en Railway (Root Directory de esa carpeta, `npm start`). Guía: **[docs/TIEMPO-REAL-VERCEL.md](docs/TIEMPO-REAL-VERCEL.md)**.

### Despliegue en Vercel

1. Variables obligatorias: `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL` (dominio de producción).
2. Vercel detecta `package-lock.json` y usa **npm install** (sin configuración extra de pnpm).
3. **Búsqueda por foto:** configura `GEMINI_API_KEY` o cuenta de servicio Vertex en Vercel (mismas variables que en local). Con Gemini no hace falta WASM/CLIP en serverless. Requiere `maxDuration` alto en `/api/ia/*` (ya configurado).
4. Ejecuta migraciones en Neon (`npm run db:migrate-*` desde tu PC).

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
| `/` | Inicio (hero y accesos rápidos) |
| `/casos-activos` | Listado y búsqueda de fichas perdidas activas |
| `/buscar` | Redirige a `/casos-activos` |
| `/comunidad` | Mapa comunitario (cercos y avistamientos) |
| `/como-funciona` | Funciones y pasos del flujo |
| `/mascota/[slug]` | Ficha pública (`PERDIDA` / `ENCONTRADA`): mapa propio, M5, timeline, chat por avistamiento |
| `/admin` | Panel estadísticas + export CSV (rol `ADMINISTRADOR`) |
| `/iniciar-sesion` | Redirige a `/` (login en modal) |

### Con sesión

| Ruta | Descripción |
|------|-------------|
| `/registro` | Alta de cuenta con correo |
| `/verificar-correo` | Estado de verificación |
| `/recuperar-contrasena` | Solicitar enlace para restablecer contraseña (correo + contraseña) |
| `/restablecer-contrasena?email=...&token=...` | Elegir nueva contraseña (enlace del correo, válido 1 h) |
| `/perfil` | Datos de usuario y accesos rápidos |
| `/notificaciones` | Historial de notificaciones (campana del menú) |
| `/chats` | Hub de conversaciones 1:1 (dueño ↔ testigo) |
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
npm run db:push
```

O en Neon SQL Editor: `drizzle/0002_modulo_mascotas.sql`.

## Mapa y avistamientos

- Mapa público en la landing con filtros; cada ficha tiene mapa solo de esa mascota.
- Avistamientos: ubicación, foto opcional, estados `PENDIENTE` / `VERIFICADO` / `DESCARTADO`.
- Email al dueño cuando el avistamiento está vinculado a su mascota (requiere SMTP).

## Búsqueda visual (Flash + Gemini Embedding 2, 768d)

Flujo: **gemini-1.5-flash** describe la imagen → **gemini-embedding-2** vectoriza el texto (768 dimensiones) → Neon pgvector compara con `<=>`.

1. Activa **Vertex AI API** y **Agent Platform API** en Google Cloud.
2. Variables (`.env.local` / Vercel):

```env
GOOGLE_CLOUD_PROJECT=tu-proyecto-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS_JSON={...}   # Vercel: JSON cuenta de servicio
VISUAL_PROVIDER=gemini
GEMINI_EMBEDDING_DIMENSION=768
```

3. **Local:** `gcloud auth application-default login` (ADC, sin API key).
4. Migración Neon: `npm run db:migrate-gemini-768` (vector 768 + columna `descripcion_ai`).
5. Reindexar: `npm run db:reindexar-visual`.

Respaldo sin Google: `VISUAL_PROVIDER=clip`.

## Actores, roles y permisos

Guía completa: **[docs/MODELO-ACTORES-Y-PERMISOS.md](./docs/MODELO-ACTORES-Y-PERMISOS.md)**

### Rol de cuenta (tabla `user.rol`)

| Rol | Quién | Permisos |
|-----|-------|----------|
| `USUARIO` | Cualquier persona registrada | Fichas, pérdidas, avistamientos, chat, mapa, búsqueda por foto |
| `ADMINISTRADOR` | Solo `paw.patrol.soporte@gmail.com` | Lo mismo + `/admin`, export CSV y moderación |

Todos los usuarios registrados tienen **las mismas funciones de cuenta**. No hay rol «ciudadano» ni «dueño» en la BD.

### Papel en un caso (dueño / testigo)

En cada avistamiento, el sistema distingue **quién perdió la mascota** y **quién la reportó**:

| Papel | Significado | En la BD |
|-------|-------------|----------|
| **Dueño** | Tiene la ficha de la mascota perdida | `mascota.user_id` |
| **Testigo** | Reportó ese avistamiento | `avistamiento.user_id` |

El chat muestra «Dueño» y «Testigo» según ese caso. La misma persona puede ser dueño en un caso y testigo en otro.

## Estructura del proyecto

```
auth.ts
src/
  app/
    page.tsx, admin/
    mis-mascotas/, mascota/[slug]/
    api/auth/, api/ia/, api/geo/, api/admin/
  actions/
    mascotas.ts, mapa.ts, avistamientos.ts, estadisticas.ts
  componentes/
    landing/, mapa/, avistamientos/, visual/, comportamiento/
  lib/
    db/, geo/, visual/, comportamiento/, tiempo-real/
drizzle/                        → Migraciones 0000–0012
scripts/                        → migraciones, reindexar embeddings
```

## Limitaciones conocidas

- Fotos antiguas pueden seguir como data URL en PostgreSQL; las **nuevas** subidas usan Vercel Blob si `BLOB_READ_WRITE_TOKEN` está configurado.
- WebSocket en proceso Node: en Vercel serverless no hay tiempo real sin servicio externo (`NEXT_PUBLIC_WS_URL`). Las suscripciones privadas requieren token firmado (`/api/ws/token`).
- Notificaciones por correo al **dueño** del avistamiento vinculado; no hay alertas masivas por radio GPS.

## Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → OAuth 2.0 Client ID.
2. URI de redirección: `http://localhost:3000/api/auth/callback/google` (y la URL de producción en Vercel).
3. Variables `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` en `.env.local` y en Vercel.

## Neon

1. Proyecto en [neon.tech](https://neon.tech).
2. `DATABASE_URL` en `.env.local` y en Vercel.
3. `npm run db:push` o SQL en `drizzle/0000_esquema_inicial.sql`.

## Despliegue (Vercel)

1. Conectar el repositorio de GitHub.
2. Añadir las mismas variables de entorno que en `.env.local`, sobre todo `NEXT_PUBLIC_APP_URL=https://pawpatroll.vercel.app` (no dejar el valor de localhost).
3. Vercel usa **npm** automáticamente si existe `package-lock.json`.
4. Redesplegar tras cambiar variables.
5. Tras el deploy, ejecutar migraciones en Neon si la BD de producción está vacía.

---

Repositorio: [github.com/Smith2207/PAWPATROLL](https://github.com/Smith2207/PAWPATROLL)
