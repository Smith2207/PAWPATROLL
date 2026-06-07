# Scripts de operaciones — PawPatrol

## Migraciones

Ver [docs/MIGRACIONES.md](../docs/MIGRACIONES.md). Cada `aplicar-migracion-*.mjs` se invoca vía `npm run db:migrate-*`.

## Utilidades de desarrollo

| Script | Uso |
|--------|-----|
| `node scripts/probar-neon.mjs` | Verifica conexión a Neon (`DATABASE_URL`) |
| `node scripts/probar-correo.mjs` | Envía correo de prueba SMTP |
| `node scripts/reindexar-embeddings-visual.mjs` | Reindexa búsqueda por foto (`npm run db:reindexar-visual`) |

## WebSocket producción

```bash
npm run ws:prod
```

Servicio en `services/pawpatroll-ws/` — ver su README.
