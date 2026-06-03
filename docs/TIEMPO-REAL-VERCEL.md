# Tiempo real en Vercel (paso a paso)

PawPatrol usa **dos piezas**:

1. **Vercel** — la web ([pawpatroll.vercel.app](https://pawpatroll.vercel.app/)): guarda mensajes, avistamientos, etc.
2. **Servidor WebSocket aparte** — siempre encendido (gratis/barato en Railway o Render): reparte eventos al instante a los navegadores.

La URL de Vercel **no puede** ser `NEXT_PUBLIC_WS_URL`. Son servicios distintos.

---

## Resumen rápido

| Dónde | Variable | Ejemplo |
|--------|----------|---------|
| **Railway** (servidor WS) | `PORT` | (lo asigna Railway) |
| **Railway** | `WS_PUBLISH_SECRET` | una clave larga aleatoria |
| **Vercel** | `NEXT_PUBLIC_WS_URL` | `wss://tu-proyecto.up.railway.app` |
| **Vercel** | `WS_PUBLISH_URL` | `https://tu-proyecto.up.railway.app/publish` |
| **Vercel** | `WS_PUBLISH_SECRET` | **la misma** clave que en Railway |

Sin el servidor WS: el chat y el mapa siguen funcionando con refresco automático (~8 s / ~90 s).

---

## Paso 1 — Quitar la URL incorrecta en Vercel

1. [vercel.com](https://vercel.com) → proyecto PawPatrol → **Settings** → **Environment Variables**.
2. Si `NEXT_PUBLIC_WS_URL` = `https://pawpatroll.vercel.app` → **elimínala** (no sirve).
3. Guarda (aún no redeploy si vas a añadir Railway después).

---

## Paso 2 — Servicio WS independiente (Railway)

**No despliegues el proyecto Next completo en Railway.** Solo la carpeta:

`services/pawpatroll-ws/`

(Ver [services/pawpatroll-ws/README.md](../services/pawpatroll-ws/README.md))

[Railway](https://railway.app) tiene plan gratuito con créditos.

1. Cuenta en Railway → **New Project** → **Deploy from GitHub repo**.
2. Elige el repo **PAWPATROLL** (el mismo que Vercel; **no** hace falta otro repositorio).
3. En el servicio, **Settings**:
   - **Root Directory:** `services/pawpatroll-ws` ← importante
   - **Start Command:** `npm start` (Railway hace `npm install` en esa carpeta)
4. **Variables** en Railway:

   | Nombre | Valor |
   |--------|--------|
   | `WS_PUBLISH_SECRET` | Genera una clave: `openssl rand -base64 32` o cualquier string largo secreto |
   | `PORT` | Railway suele inyectar `PORT` solo; no hace falta si ya existe |

5. **Networking** → genera un **dominio público** (ej. `pawpatroll-ws-production.up.railway.app`).
6. Espera deploy **Success** y prueba salud:  
   `https://TU-DOMINIO-RAILWAY.app/health` → debe responder `{"ok":true,...}`.

---

## Paso 3 — Variables en Vercel (conectar web ↔ WS)

En Vercel → **Environment Variables** (Production):

| Variable | Valor |
|----------|--------|
| `NEXT_PUBLIC_WS_URL` | `wss://TU-DOMINIO-RAILWAY.app` |
| `WS_PUBLISH_URL` | `https://TU-DOMINIO-RAILWAY.app/publish` |
| `WS_PUBLISH_SECRET` | **Igual** que en Railway |

Importante:

- Cliente navegador → **`wss://`** (WebSocket seguro).
- Vercel servidor → **`https://.../publish`** (HTTP POST).
- **Misma** `WS_PUBLISH_SECRET` en ambos lados.

4. **Redeploy** el proyecto en Vercel.

---

## Paso 4 — Probar

1. Abre [pawpatroll.vercel.app](https://pawpatroll.vercel.app/) en dos navegadores (o normal + incógnito), dos cuentas.
2. Entra al **mismo chat** de avistamiento.
3. Envía un mensaje desde uno → el otro debería actualizarse al instante (sin recargar).
4. F12 → **Red** → **WS**: debe verse conexión a `wss://TU-DOMINIO-RAILWAY.app` en estado **101** o abierta.

---

## Alternativa: Render

1. [render.com](https://render.com) → **New** → **Web Service** → repo GitHub.
2. **Root Directory:** `services/pawpatroll-ws`
3. **Start Command:** `npm start`
4. Mismas variables: `WS_PUBLISH_SECRET`, `PORT` (Render lo define).

## ¿Otro repositorio GitHub?

No es obligatorio. Un solo repo con dos despliegues:

| Plataforma | Carpeta |
|------------|---------|
| Vercel | `/` (app Next) |
| Railway / Render | `services/pawpatroll-ws` |

Opcional: copiar solo `services/pawpatroll-ws` a un repo nuevo si quieres aislarlo por completo.

---

## Desarrollo local

```bash
# Terminal 1
npm run dev

# Terminal 2 — servicio independiente (services/pawpatroll-ws)
npm run ws:prod
```

En `.env.local` (solo para probar el puente con `ws:prod`):

```env
WS_PUBLISH_URL=http://localhost:3001/publish
WS_PUBLISH_SECRET=dev-secreto-local
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

Con solo `npm run dev`, el WS integrado en `:3001` suele bastar en local; `ws:prod` replica Railway.

---

## Si no quieres Railway (solo Vercel)

No configures `NEXT_PUBLIC_WS_URL` ni `WS_PUBLISH_*`.

- Chat: refresco cada **~8 s**.
- Mapa: refresco cada **~90 s**.
- Mensajes y notificaciones por BD/correo siguen funcionando.

---

## Solución de problemas

| Síntoma | Qué revisar |
|---------|-------------|
| WS falla en el navegador | `NEXT_PUBLIC_WS_URL` debe ser `wss://` al dominio Railway, no la URL de Vercel |
| Mensajes no llegan al instante | `WS_PUBLISH_URL` y `WS_PUBLISH_SECRET` en Vercel; redeploy después de añadirlas |
| 401 en publish | Secreto distinto entre Vercel y Railway |
| Railway duerme (plan free) | Primer mensaje lento; considera plan pago o Render con keep-alive |
