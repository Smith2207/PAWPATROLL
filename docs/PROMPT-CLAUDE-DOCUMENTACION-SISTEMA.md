# PROMPT PARA CLAUDE — Documentación del Sistema PawPatrol

> **Instrucciones para el estudiante:** Copia TODO el bloque entre `---INICIO PROMPT---` y `---FIN PROMPT---` y pégalo en Claude (o ChatGPT). Adjunta también el repositorio o los archivos listados al final si Claude tiene acceso a archivos.

---

## ---INICIO PROMPT---

Eres un ingeniero de software senior redactando documentación académica formal en **español (Perú)**.

## Tu tarea

Genera la **Documentación del Sistema** completa del proyecto **PawPatrol (PAWPATROLL)** siguiendo **exactamente** la estructura que me dio mi docente (versión concisa y resumida). El documento debe servir para entrega universitaria.

## Estructura obligatoria (del docente)

Debes incluir **todas** estas secciones, en este orden:

### 1. Documentación Estratégica
- Visión y alcance del sistema
- Requerimientos funcionales (RF) numerados
- Requerimientos no funcionales (RNF) numerados
- Matriz de trazabilidad (RF → componentes → tablas BD)

### 2. Arquitectura
- Vista de contexto (diagrama C4 nivel 1)
- Vista lógica (capas)
- Vista de procesos (diagrama de secuencia del flujo principal)
- Patrones y estilos aplicados
- Decisiones arquitectónicas (ADR) con contexto, decisión y consecuencias
- Diagramas en **Mermaid** (flowchart, sequenceDiagram, erDiagram)

### 3. Diseño Detallado
- Especificación de módulos M1–M7 con responsabilidades
- Interfaces públicas (Server Actions, APIs, librerías clave)
- Algoritmos críticos con análisis de complejidad (O(n), etc.)
- Ejemplos de uso y casos límite

### 4. Base de Datos
- Modelo entidad-relación (MER) con diagrama Mermaid
- Diccionario de datos (tablas principales: columnas, tipos, restricciones, índices)
- Política de respaldo y recuperación (RPO, RTO)

### 5. Documentación de API
- Referencia a OpenAPI/Swagger
- Tabla de endpoints REST principales (método, ruta, auth, descripción)
- Autenticación y autorización

### 6. Implementación
- Requisitos de desarrollo (Node, npm, etc.)
- Guía de instalación local paso a paso
- Despliegue en producción (Vercel, Neon, Railway, Blob)
- Configuración por entorno (variables clave)

### 7. Convenciones de Código
- Estándares (naming, TypeScript, CSS, imports)
- Control de versiones (Git, rama main, commits en español)

### 8. Plan de Pruebas
- Niveles: unitarias, integración, sistema, aceptación
- Cobertura esperada (mínimo 80% — indicar estado actual y plan)
- Casos de prueba principales (tabla CP-01, CP-02…)
- Datos de prueba y comando de ejecución (`npm run test`)

### 9. Seguridad
- Análisis de amenazas y mitigaciones
- Buenas prácticas aplicadas (bcrypt, rate limit, etc.)

### 10. Operación y Mantenimiento
- Procedimientos operacionales estándar (SOP)
- Monitoreo y alertas
- Logs y auditoría
- Plan de recuperación de desastres (RPO, RTO)

### 11. Versionado y Cambios
- Esquema de versiones
- Referencia al CHANGELOG
- Matriz de compatibilidad
- Elementos deprecados

### 12. Checklist de Completitud
Incluir la checklist del docente con estado ✅ / ⚠️ / ❌:

- ☐ Visión, alcance y requerimientos redactados
- ☐ Matriz de trazabilidad actualizada
- ☐ Vistas arquitectónicas documentadas
- ☐ ADRs para decisiones críticas
- ☐ Especificación de módulos con interfaces
- ☐ Schema de base de datos normalizado
- ☐ API documentada en OpenAPI/Swagger
- ☐ Guía de instalación probada
- ☐ Convenciones de código formalizadas
- ☐ Plan de pruebas completado
- ☐ Análisis de seguridad realizado
- ☐ Procedimientos operacionales documentados
- ☐ CHANGELOG actualizado

---

## Datos del proyecto (usa esta información como fuente de verdad)

### Metadatos
| Campo | Valor |
|-------|-------|
| **Nombre** | PawPatrol (PAWPATROLL) |
| **Autor** | Branly Paucar Arias |
| **GitHub** | https://github.com/Smith2207/PAWPATROLL |
| **Demo producción** | https://pawpatroll.vercel.app |
| **Versión documento** | 1.1 · junio 2026 |
| **Tipo** | Proyecto de tesis / curso — plataforma web comunitaria |

### Visión (resumen)
PawPatrol es una plataforma web donde usuarios registrados crean **fichas digitales de mascotas**, reportan **pérdidas** y **avistamientos**, se coordinan por **mapa** y **chat privado**, y usan **búsqueda visual por foto con IA** (Gemini Embedding 768d), **predicción de comportamiento animal (M5)** y **tiempo casi real** (WebSocket).

### Modelo de actores (MUY IMPORTANTE — no confundir)
Hay **dos niveles**:

| Nivel | Qué es | Valores |
|-------|--------|---------|
| **Cuenta** (`user.rol`) | Rol en la BD | `USUARIO`, `ADMINISTRADOR` |
| **Caso / chat** | Papel en un avistamiento | **Dueño**, **Testigo** |

- **USUARIO:** todos los registrados (mismas funciones: fichas, pérdidas, avistamientos, chat).
- **ADMINISTRADOR:** solo soporte (`paw.patrol.soporte@gmail.com`); acceso a `/admin`.
- **Dueño:** quien tiene la ficha (`mascota.user_id`) — perdió la mascota en ese caso.
- **Testigo:** quien reportó el avistamiento (`avistamiento.user_id`).

Un mismo USUARIO puede ser dueño en un caso y testigo en otro. **No usar** los términos "propietario" ni roles viejos `CIUDADANO`/`DUENO` (eliminados en migración 0013).

### Alcance v1

**Dentro:** registro/login (correo + Google), verificación email, recuperación contraseña, fichas con fotos y estados, reporte público pérdida/avistamiento con geo, mapa Leaflet (cercos, calor, refugios), búsqueda por foto, panel predictivo M5, chat 1:1 por avistamiento, notificaciones in-app, panel admin.

**Fuera:** app móvil nativa, pagos, SMS masivos, moderación automática con IA, integración refugios municipales.

### Stack tecnológico
- **Next.js 16** (App Router) + **React 19** + **TypeScript** estricto
- **Auth.js 5** (JWT, Google OAuth, credenciales bcrypt)
- **Neon PostgreSQL** + **Drizzle ORM**
- **Vercel** (deploy app) + **Vercel Blob** (fotos/adjuntos)
- **Railway** — microservicio WebSocket (`services/pawpatroll-ws`)
- **Leaflet** — mapas
- **Google:** OAuth, Maps/Places, Gemini Flash + Embedding 2 (768d)
- Respaldo visual: **CLIP** local (`VISUAL_PROVIDER=clip`)
- Tests: **Vitest**

### Módulos M1–M7

| Módulo | Nombre | Responsabilidad |
|--------|--------|-----------------|
| M1 | Autenticación | Registro, login, verificación, perfil, roles |
| M2 | Fichas mascotas | CRUD, estados (EN_CASA→PERDIDA→ENCONTRADA→REUNIDA), ficha pública |
| M3 | Búsqueda visual | Indexar/buscar por foto (Gemini 768d / CLIP) |
| M4 | Mapa y geo | Mapa comunitario, geocodificación, Places Perú |
| M5 | Comportamiento | Predicción radio, zonas refugio, cerco dinámico, consejos |
| M6 | Casos y chat | Avistamientos, notificaciones, chat 1:1 por reporte |
| M7 | Administración | Stats, export CSV, moderación abusos |

### Requerimientos funcionales (RF-01 a RF-15)
Documentar al menos estos:

| ID | Requerimiento |
|----|---------------|
| RF-01 | Registro correo/contraseña o Google OAuth |
| RF-02 | Correo verificación y bienvenida |
| RF-03 | Recuperación contraseña (enlace 1 h) |
| RF-04 | CRUD fichas mascotas (hasta 5 fotos) |
| RF-05 | Cambio estados EN_CASA → PERDIDA → ENCONTRADA → REUNIDA |
| RF-06 | Ficha pública por slug cuando PERDIDA/ENCONTRADA |
| RF-07 | Reportar avistamiento con ubicación y foto opcional |
| RF-08 | Notificación al dueño (in-app + email SMTP) |
| RF-09 | Dueño verifica/descarta avistamientos |
| RF-10 | Chat privado dueño ↔ testigo por avistamiento |
| RF-11 | Mapa casos activos, avistamientos, capas comportamiento |
| RF-12 | Predicción radio, refugios, consejos según perfil |
| RF-13 | Búsqueda mascotas similares subiendo foto |
| RF-14 | Admin en `/admin`, export CSV, moderación |
| RF-15 | Mapa y chat tiempo real (WS Railway o polling respaldo) |

### ADRs que debes documentar (mínimo 7)
1. Next.js App Router + Server Actions (mutaciones sin REST propio)
2. Neon PostgreSQL serverless + Drizzle
3. WebSocket en servicio separado Railway (Vercel no soporta WS persistente)
4. Búsqueda visual Gemini Embedding 768d (CLIP como respaldo)
5. Vercel Blob para archivos nuevos (fotos, adjuntos chat)
6. Roles simplificados USUARIO / ADMINISTRADOR (migración 0013)
7. Conversación ligada a cada reporte de avistamiento (no chat global por rol)

### Base de datos — tablas principales
- `user`, `account`, `session`, `verificationToken` (Auth.js)
- `mascota`, `mascota_foto`, `historial_estado_mascota`, `mascota_embedding`
- `avistamiento`, `mensaje_avistamiento`, `lectura_chat`
- `notificacion`, `evento_caso`, `reporte_abuso`

**Migraciones:** `drizzle/0000` … `drizzle/0015` (0015 elimina campo microchip).

**Estados mascota:** EN_CASA, PERDIDA, ENCONTRADA, REUNIDA  
**Estados avistamiento:** PENDIENTE, VERIFICADO, DESCARTADO

### APIs REST principales
| Método | Ruta | Auth |
|--------|------|------|
| GET | `/api/auth/verificar-correo` | No |
| GET/POST | `/api/auth/verificar-cuenta` | No |
| GET | `/api/geo/buscar`, `/api/geo/lugar`, `/api/geo/reverse` | No |
| POST | `/api/geo/ubicacion` | No |
| GET | `/api/ubigeo/buscar` | No |
| POST | `/api/ia/buscar` | No (rate limit IP) |
| POST | `/api/ia/indexar` | Sí (dueño) |
| POST | `/api/avistamiento/mensaje` | Sí |
| GET | `/api/chat/adjunto/[id]` | Sí |
| GET | `/api/ws/token` | Sí |
| GET | `/api/admin/export` | Admin |

OpenAPI existente: `docs/openapi.yaml`

### Algoritmos críticos a documentar
1. **Similitud coseno** entre embeddings 768d — O(n×d)
2. **Radio búsqueda temporal (M5)** — O(a) avistamientos
3. **Cerco dinámico** — polígono GeoJSON O(a)

### Instalación local (resumen)
```bash
git clone https://github.com/Smith2207/PAWPATROLL.git
cd PAWPATROLL
npm install
cp .env.example .env.local
npm run db:push
# migraciones: npm run db:migrate-* (ver README)
npm run test
npm run dev
```
Local: Next `:3000`, WebSocket `:3001` vía `instrumentation.ts`.

### Despliegue producción
| Componente | Plataforma |
|------------|------------|
| App | Vercel (auto-deploy `main`) |
| BD | Neon (DATABASE_URL pooled) |
| Archivos | Vercel Blob |
| WebSocket | Railway (`services/pawpatroll-ws`) |
| IA/Maps | Google Cloud |

### Tests existentes (Vitest)
- `src/lib/mascotas/estados.test.ts`
- `src/lib/chat/mensaje.test.ts`
- `src/lib/api/rate-limit.test.ts`

Comando: `npm run test`. Cobertura 80%: **en progreso** — documentar plan de ampliación.

### Seguridad — puntos clave
- bcrypt contraseñas, JWT sesión, middleware `proxy.ts`
- Rate limit APIs IA/geo (`src/lib/api/rate-limit.ts`)
- Adjuntos chat en Blob privado con verificación sesión
- Token WS con HMAC `WS_PUBLISH_SECRET`
- Cuentas desactivables (`user.activo=false`)

### Flujo principal (para diagrama de secuencia)
Dueño marca PERDIDA → indexa embedding → testigo reporta avistamiento PENDIENTE → email/notificación dueño → dueño verifica → chat dueño↔testigo → posible ENCONTRADA/REUNIDA.

---

## Formato de salida que necesito

1. **Un solo documento Markdown** completo (`DOCUMENTACION_DEL_SISTEMA.md`)
2. Longitud: **completo pero conciso** (como guía académica resumida del docente, no un manual de 200 páginas)
3. Usa **tablas** para RF, RNF, endpoints, diccionario de datos, checklist
4. Usa **diagramas Mermaid** renderizables (contexto, secuencia, MER)
5. Tono: **formal académico**, tercera persona, español Perú
6. Incluir portada con: título, versión, fecha, autor, demo, repositorio
7. Índice con enlaces a secciones
8. Al final: nota *"Documento elaborado para entrega académica — PawPatrol 2026"*

**Opcional (si puedes):** indica al final cómo convertir a Word con:
```bash
python3 scripts/md-a-word.py
```

---

## Archivos de referencia (si tienes acceso al repo)

Prioriza leer y actualizar sobre estos (pueden estar desactualizados en migraciones):

| Archivo | Contenido |
|---------|-----------|
| `docs/DOCUMENTACION_DEL_SISTEMA.md` | Borrador existente — **actualizar y completar** |
| `README.md` | Instalación, variables entorno |
| `README-MODULOS.md` | Detalle M1–M7, Server Actions, rutas |
| `docs/MODELO-ACTORES-Y-PERMISOS.md` | Dueño vs testigo vs rol cuenta |
| `docs/openapi.yaml` | API OpenAPI |
| `docs/MIGRACIONES.md` | Guía migraciones |
| `docs/DEPLOY-Y-RUTAS.md` | Deploy y rutas legacy |
| `docs/TIEMPO-REAL-VERCEL.md` | WebSocket producción |
| `src/lib/db/schema.ts` | Schema Drizzle actual |
| `drizzle/*.sql` | Migraciones 0000–0015 |
| `CHANGELOG.md` | Historial cambios |

**No inventes** funcionalidades que no existen en el código. Si algo no está implementado (p. ej. cobertura 80%), márcalo como ⚠️ en progreso con plan concreto.

---

## ---FIN PROMPT---
