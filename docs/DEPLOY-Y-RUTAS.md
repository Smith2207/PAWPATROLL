# Despliegue, rutas legacy y notas de producción

## Vercel (Next.js)

1. Conecta el repo y configura las variables de `.env.example`.
2. `NEXT_PUBLIC_APP_URL` debe ser la URL pública (`https://tu-dominio.vercel.app`).
3. Ejecuta migraciones contra la BD de producción (ver [MIGRACIONES.md](./MIGRACIONES.md)).
4. Opcional tiempo real: servicio `services/pawpatroll-ws` en Railway — ver [TIEMPO-REAL-VERCEL.md](./TIEMPO-REAL-VERCEL.md).

## WebSocket producción

```bash
npm run ws:prod
```

El servicio canónico es `services/pawpatroll-ws/` (no uses scripts deprecated).

## Rutas legacy (solo redirección)

| Ruta antigua | Redirige a | Motivo |
|--------------|------------|--------|
| `/buscar` | `/casos-activos` | Búsqueda unificada en casos activos |
| `/iniciar-sesion` | `/` | Login en modal global |
| `/registro` | `/?registro=1` | Registro en modal global |

Actualiza enlaces en emails y documentación externa si apuntaban a estas rutas.

## Auth.js (next-auth v5 beta)

El proyecto usa `next-auth@5.0.0-beta.31`. Antes de actualizar a estable:

- Revisa [releases de Auth.js](https://github.com/nextauthjs/next-auth/releases).
- Tras actualizar, prueba: login correo, Google OAuth, verificación, recuperar contraseña, sesión en `/mis-mascotas`.

## Rate limiting en APIs

Implementación en memoria (`src/lib/api/rate-limit.ts`): válida como **primera barrera** por instancia serverless.

- Respuesta `429` incluye `Retry-After` y opcionalmente `X-RateLimit-Limit`.
- Para tráfico alto en Vercel, valora **Upstash Redis** o Vercel KV compartido entre instancias.

## CSS por ruta

| Hoja | Cuándo se carga |
|------|-----------------|
| Global (`layout.tsx`) | Todas las páginas |
| `admin.css` | Solo `/admin` |
| `chat.css` + `coordinacion.css` | `/chats`, `/avistamiento/[id]`, `/mis-mascotas/[id]/caso` |

## CI local

```bash
npm run lint
npm run test
npm run build
```
