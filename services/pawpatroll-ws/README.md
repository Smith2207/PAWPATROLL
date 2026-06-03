# pawpatroll-ws

Servicio **independiente** de WebSocket para [PawPatrol](https://pawpatroll.vercel.app).

- **No** incluye Next.js, base de datos ni Gemini.
- Solo Node + `ws` (~1 MB de dependencias).
- Se despliega aparte en **Railway** o **Render**; la web sigue en **Vercel**.

## Por qué una carpeta aparte

| Despliegue | Qué corre | Problema |
|------------|-----------|----------|
| Repo completo en Railway | Next + WS + build pesado | Lento, caro, innecesario |
| **Solo `services/pawpatroll-ws`** | Solo WebSocket | Correcto |

Mismo repositorio GitHub; Railway usa **Root Directory** = esta carpeta.

## Railway (recomendado)

1. Mismo repo: `Smith2207/PAWPATROLL`
2. **New Service** → Settings:
   - **Root Directory:** `services/pawpatroll-ws`
   - **Start Command:** `npm start` (o dejar vacío; Railway ejecuta `npm start` del package.json local)
3. Variables:
   - `WS_PUBLISH_SECRET` = clave secreta larga
4. **Generate Domain** → ej. `pawpatroll-ws.up.railway.app`
5. Probar: `https://TU-DOMINIO/health`

## Variables en Vercel (app principal)

| Variable | Valor |
|----------|--------|
| `NEXT_PUBLIC_WS_URL` | `wss://TU-DOMINIO-RAILWAY` |
| `WS_PUBLISH_URL` | `https://TU-DOMINIO-RAILWAY/publish` |
| `WS_PUBLISH_SECRET` | Igual que en Railway |

Guía completa: [docs/TIEMPO-REAL-VERCEL.md](../../docs/TIEMPO-REAL-VERCEL.md)

## Local

```bash
cd services/pawpatroll-ws
npm install
WS_PUBLISH_SECRET=dev-local npm start
```

Desde la raíz del monorepo:

```bash
npm run ws:prod
```

## ¿Repo GitHub separado?

Opcional. Con **Root Directory** en Railway no hace falta otro repo: un solo `PAWPATROLL`, dos despliegues (Vercel raíz + Railway `services/pawpatroll-ws`).
