# Migraciones de base de datos — PawPatrol

Neon PostgreSQL + Drizzle ORM. Los archivos SQL están en `drizzle/0000` … `drizzle/0012`.

## Entorno nuevo (recomendado)

```bash
cp .env.example .env.local
# Configura DATABASE_URL

npm install
npm run db:push          # sincroniza schema desde src/lib/db/schema.ts
```

`db:push` es suficiente para **desarrollo local** si partes de cero.

## Producción o equipo con BD existente

Ejecuta las migraciones **en orden** (solo las que aún no hayas aplicado):

| Script npm | SQL | Contenido |
|------------|-----|-----------|
| `db:migrate-mapa` | 0004 | Módulo mapa |
| `db:migrate-embeddings` | 0005 | Embeddings visuales |
| `db:migrate-embeddings-multifoto` | 0006 | Multifoto embeddings |
| `db:migrate-comportamiento` | 0007 | Comportamiento + avistamientos |
| `db:migrate-acceso-exterior` | 0008 | Campo `acceso_exterior` |
| `db:migrate-gemini-768` | 0009 | Embeddings Gemini 768d |
| `db:migrate-notificaciones` | 0010 | Notificaciones + lecturas chat |
| `db:migrate-usuario-activo` | 0011 | Usuario activo |
| `db:migrate-chat-adjunto` | 0012 | Adjuntos chat en Vercel Blob |

Cada script lee `DATABASE_URL` de `.env.local` y aplica el SQL correspondiente.

## Después de migrar embeddings Gemini

```bash
npm run db:reindexar-visual
```

Requiere credenciales Google Cloud (ver `.env.example`).

## Reglas

1. **No mezclar** `db:push` destructivo en producción sin revisar el diff de Drizzle Kit.
2. En **Vercel**, las migraciones se ejecutan **manualmente** desde tu máquina o CI con `DATABASE_URL` de producción.
3. Mantén `drizzle/` y `src/lib/db/schema.ts` alineados: cambios de schema → `npm run db:generate` → nuevo SQL → script en `scripts/` si hace falta.

## Herramientas de diagnóstico

```bash
npm run db:studio    # Drizzle Studio
node scripts/probar-neon.mjs
node scripts/probar-correo.mjs
```
