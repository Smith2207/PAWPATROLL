# PawPatrol — Módulos M1 a M7

Referencia de **todos los módulos funcionales** del proyecto, con sus métodos (Server Actions, APIs, librerías y rutas).

| Módulo | Nombre | Migración principal |
|--------|--------|---------------------|
| **M1** | Autenticación y usuarios | `0000`, `0001`, `0003`, `0011` |
| **M2** | Fichas de mascotas | `0002` |
| **M3** | Búsqueda visual por foto | `0005`, `0006`, `0009` |
| **M4** | Mapa comunitario y geolocalización | `0004` |
| **M5** | Comportamiento predictivo (M5) | `0007`, `0008` |
| **M6** | Avistamientos, casos, chat y notificaciones | `0007`, `0010` |
| **M7** | Panel administrativo | `0011` (+ acciones en `admin.ts`) |

---

## M1 — Autenticación y usuarios

Registro, inicio de sesión (correo + Google), verificación de cuenta, recuperación de contraseña y perfil.

**Roles de cuenta:** `USUARIO` (todos) y `ADMINISTRADOR` (solo soporte). Dueño/testigo son papeles por caso, no roles de BD — ver [MODELO-ACTORES-Y-PERMISOS.md](./docs/MODELO-ACTORES-Y-PERMISOS.md).

### Rutas

| Ruta | Descripción |
|------|-------------|
| `/registro` | Alta con correo y contraseña |
| `/verificar-correo` | Estado de verificación |
| `/recuperar-contrasena` | Solicitar enlace de restablecimiento |
| `/restablecer-contrasena` | Nueva contraseña (token en URL) |
| `/perfil` | Datos personales, foto, contraseña |
| `/perfil/cambiar-contrasena` | Cambio de contraseña con sesión activa |
| `/api/auth/[...nextauth]` | Handlers Auth.js (Google + credenciales) |

### Server Actions — `src/actions/autenticacion.ts`

| Función | Descripción |
|---------|-------------|
| `registrarUsuario` | Crea cuenta con bcrypt; envía correo de verificación |
| `reenviarCorreoVerificacion` | Reenvía enlace de verificación |
| `verificarCorreoConToken` | Marca `emailVerified` con token |
| `solicitarRecuperacionContrasena` | Genera token 1 h y envía correo |
| `restablecerContrasenaConToken` | Actualiza `passwordHash` |
| `cambiarContrasenaSesion` | Cambio con contraseña actual |
| `actualizarPerfil` | Nombre, teléfono, ciudad, preferencias |
| `actualizarImagenPerfil` | Foto de perfil (data URL) |
| `obtenerContactoPerfil` | Teléfono/ciudad para formularios |
| `obtenerDatosPerfil` | Datos completos del usuario logueado |
| `obtenerEstadoBienvenida` | Si debe completar onboarding |
| `completarBienvenida` | Guarda datos iniciales post-registro |
| `obtenerImagenPerfilSesion` | Imagen para UI de sesión |

### API REST

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/auth/verificar-correo?token=&email=` | Verificar desde enlace del correo |
| `GET` / `POST` | `/api/auth/verificar-cuenta` | Verificar o consultar estado (JSON) |

### Auth core — `auth.ts` + `auth.config.ts`

| Export | Descripción |
|--------|-------------|
| `handlers` | Rutas OAuth y credenciales |
| `auth` | Obtener sesión en server components / actions |
| `signIn` / `signOut` | Inicio y cierre de sesión |

Callbacks relevantes: sincronización de rol admin, bloqueo de cuentas desactivadas (`activo = false`).

### Librería — `src/lib/auth/`

| Archivo | Funciones / utilidades |
|---------|------------------------|
| `admin.ts` | `esCorreoAdmin`, `rolParaNuevoUsuario`, `normalizarCorreo`, `CORREO_ADMIN_SOPORTE` |
| `roles.ts` | `etiquetaRol` — USUARIO o ADMINISTRADOR |
| `verificar-cuenta.ts` | Lógica de tokens de verificación |
| `recuperar-contrasena.ts` | Tokens de recuperación |
| `validacion-correo.ts` | `esCorreoValido`, `mensajeCorreoInvalido` |
| `validacion-imagen.ts` | Validación de fotos de perfil |
| `imagen-token.ts` | `imagenParaJwt` (truncar data URL en JWT) |

### Email — `src/lib/email/`

| Función | Uso |
|---------|-----|
| `enviarCorreoVerificacion` | Enlace de verificación |
| `enviarCorreoBienvenida` | Tras verificar o Google |
| `enviarCorreoRecuperacion` | Restablecer contraseña |
| `plantillaVerificacion` / `plantillaRecuperarContrasena` / `plantillaBienvenida` | HTML de correos |

### Middleware — `src/proxy.ts`

Protege `/perfil`, `/mis-mascotas`, `/admin`. Solo `ADMINISTRADOR` accede a `/admin`.

---

## M2 — Fichas de mascotas

CRUD de fichas, fotos, estados del ciclo de vida y ficha pública compartible.

### Rutas

| Ruta | Descripción |
|------|-------------|
| `/mis-mascotas` | Listado de mis fichas |
| `/mis-mascotas/ficha` | Crear nueva ficha |
| `/mis-mascotas/[id]` | Editar, cambiar estado, eliminar |
| `/mis-mascotas/[id]/caso` | Panel de coordinación (M6) |
| `/mascota/[slug]` | Ficha pública (`PERDIDA` / `ENCONTRADA`) |
| `/casos-activos` | Listado público de pérdidas activas |
| `/buscar` | Redirige a `/casos-activos` |

### Server Actions — `src/actions/mascotas.ts`

| Función | Descripción |
|---------|-------------|
| `listarMisMascotas` | Fichas del usuario con contadores |
| `buscarMascotasPublicas` | Búsqueda en casos activos |
| `listarMascotasPerdidasPublicas` | Feed landing / casos activos |
| `obtenerMascotaPropia` | Ficha editable por ID |
| `obtenerMascotaPublica` | Ficha por slug (pública) |
| `crearMascota` | Alta completa con fotos |
| `actualizarMascota` | Edición de campos y fotos |
| `cambiarEstadoMascota` | `EN_CASA` → `PERDIDA` → `ENCONTRADA` → `REUNIDA` |
| `eliminarMascota` | Borrado en cascada |

### Server Actions — `src/actions/estadisticas.ts`

| Función | Descripción |
|---------|-------------|
| `obtenerEstadisticasLanding` | Contadores hero (usuarios, perdidas, reunidas, avistamientos) |

### Librería — `src/lib/mascotas/`

| Archivo | Contenido |
|---------|-----------|
| `estados.ts` | `ETIQUETAS_ESTADO`, `TRANSICIONES_ESTADO`, `esFichaPublica` |
| `tipos.ts` | `TIPOS_MASCOTA`, `emojiPorTipo` |
| `catalogos.ts` | Sexos, tamaños, direcciones de movimiento |
| `validacion.ts` | Reglas de formulario |
| `formatoFicha.ts` | Formateo para UI |
| `razas.ts` | Catálogo de razas |
| `opciones-acceso-exterior.ts` | Campo M5 `accesoExterior` |

### Librería — `src/lib/perdidas/`

| Archivo | Contenido |
|---------|-----------|
| `publicar-reporte.ts` | Flujo publicar pérdida desde modal |
| `borrador-cliente.ts` | Borrador en `localStorage` si no hay sesión |

### Estados de mascota

`EN_CASA` · `PERDIDA` · `ENCONTRADA` · `REUNIDA`

Al pasar a `PERDIDA` con fotos se dispara indexación visual (M3).

---

## M3 — Búsqueda visual por foto

Coincidencias por similitud visual con **Gemini Embedding 2** (768d) o respaldo **CLIP**.

### Rutas / UI

| Ubicación | Descripción |
|-----------|-------------|
| `/` (modal) | Búsqueda por foto en landing |
| `/api/ia/buscar` | Endpoint principal de búsqueda |
| `/api/ia/indexar` | Reindexar embeddings de una mascota |

### API REST

| Método | Ruta | Body / params | Descripción |
|--------|------|---------------|-------------|
| `POST` | `/api/ia/buscar` | `{ imagen: dataUrl }` o `multipart` | Top coincidencias visuales |
| `POST` | `/api/ia/indexar` | `{ mascotaId }` | Sincroniza embeddings de todas las fotos |

### Librería — `src/lib/visual/indice-visual.ts`

| Función | Descripción |
|---------|-------------|
| `guardarEmbeddingFoto` | Persiste vector en Neon (pgvector) |
| `eliminarEmbeddingsMascota` | Limpia índice al borrar/editar |
| `sincronizarEmbeddingMascota` | Reindexa todas las fotos de una ficha |
| `buscarSimilaresPorFoto` | Búsqueda k-NN con rerank y filtros |

### Librería — embeddings y proveedores

| Archivo | Funciones clave |
|---------|-----------------|
| `embedding.ts` | `proveedorVisualActivo`, `embeddingDesdeDataUrl`, `coseno` |
| `gemini-embedding.ts` | Embedding vía Vertex / Gemini |
| `clip-embedding.ts` | Respaldo local WASM (`VISUAL_PROVIDER=clip`) |
| `rerank.ts` | `puntuacionConRerank`, `FiltrosBusquedaVisual` |
| `extraer-caracteristicas.ts` | Heurísticas de color/tipo (M3) |
| `etiquetas-parecido.ts` | `nivelParecido`, `textoParecido` |
| `config.ts` | Umbrales `VISUAL_*` |
| `preprocesar-imagen.ts` | Normalización antes de embed |

### Scripts

```bash
npm run db:migrate-embeddings
npm run db:migrate-embeddings-multifoto
npm run db:migrate-gemini-768
npm run db:reindexar-visual
```

---

## M4 — Mapa comunitario y geolocalización

Mapa Leaflet en landing y `/comunidad`, filtros, geocodificación y capa de calor.

### Rutas

| Ruta | Descripción |
|------|-------------|
| `/comunidad` | Mapa comunitario (pérdidas activas) |
| `/` (sección mapa) | Vista hero con mapa |

### Server Actions — `src/actions/mapa.ts`

| Función | Descripción |
|---------|-------------|
| `listarDatosMapaPublico` | Pérdidas, avistamientos, `puntosCalor`, filtros |
| `listarDatosMapaMascota` | Mapa exclusivo de una ficha perdida |

Tipos exportados: `MarcadorPerdidaMapa`, `MarcadorAvistamientoMapa`, `DatosMapaPublico`, `DatosMapaMascota`.

### Server Actions — `src/actions/comunidad.ts`

| Función | Descripción |
|---------|-------------|
| `listarActividadComunidad` | Feed reciente (reuniones, avistamientos) |
| `listarTopColaboradores` | Ranking por avistamientos verificados |

### API REST — geo

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/geo/buscar?q=` | Autocompletado Nominatim (Perú) |
| `GET` | `/api/geo/reverse?lat=&lng=` | Dirección desde coordenadas |
| `GET` | `/api/ubigeo/buscar?q=` | Ubigeo Perú (ciudades/distritos) |

### Librería — `src/lib/geo/`

| Archivo | Funciones clave |
|---------|-----------------|
| `geocodificar.ts` | `buscarLugaresPorTexto`, `obtenerDireccionDesdeCoords` |
| `ubigeo-peru.ts` | `buscarUbicacionesPeru` |
| `ciudades.ts` | `buscarCiudadesDesdeApi` |
| `tipos.ts` | `CENTRO_MAPA_DEFECTO`, `parsearCoordenada`, `coordenadasValidas` |
| `distancia.ts` | `distanciaMetros` (Haversine) |
| `agrupar-marcadores.ts` | Agrupación de pins cercanos |
| `cerco-perimetrico.ts` | `estimarRadioBusquedaMetros` |
| `leaflet-iconos.ts` | Iconos HTML/SVG para Leaflet |
| `iconos-mapa-html.ts` | SVG para popups |

### Librería — `src/lib/mapa/`

| Archivo | Contenido |
|---------|-----------|
| `filtros.ts` | `FiltrosMapaPublico` (días, tipo, estado avist.) |
| `filtrar-por-mascota.ts` | Recorte de datos para ficha individual |
| `colores-cerco.ts` | Paleta por mascota en mapa comunitario |

### Componentes

| Componente | Rol |
|------------|-----|
| `MapaPawPatrol.tsx` | Mapa principal (calor, cercos, rutas, refugios M5) |
| `FiltrosMapa.tsx` | UI de filtros |
| `SelectorUbicacionMapa.tsx` | Pin en formularios |

### Tiempo real (mapa)

| Archivo | Funciones |
|---------|-----------|
| `lib/tiempo-real/hub.ts` | `emitirTiempoReal`, `suscribirCanal`, canal `mapa` |
| `lib/tiempo-real/servidor-ws.ts` | WebSocket local (`WS_PORT` 3001) |
| `lib/tiempo-real/ws-disponible.ts` | Detección de WS en cliente |

Eventos: `mapa:actualizado`, `avistamiento:nuevo`, `avistamiento:actualizado`.

---

## M5 — Comportamiento predictivo

Cerco dinámico, expansión temporal, zonas de refugio y consejos según perfil conductual.

### Dónde se usa

- Ficha pública `/mascota/[slug]` — mapa con cerco, ruta #1→#N, refugios
- `PanelComportamiento.tsx` — consejos al dueño
- Integrado en `listarDatosMapaMascota` y `MapaPawPatrol`

### Server Actions — predicción vía `src/actions/mapa.ts`

La predicción conductual se calcula al listar datos del mapa (`listarDatosMapaMascota`, `listarMarcadoresMapaComunidad`) usando `calcularPrediccionComportamiento` de la librería. No hay action dedicada aparte.

### Librería — `src/lib/comportamiento/`

| Archivo | Funciones clave |
|---------|-----------------|
| `prediccion.ts` | `calcularPrediccionComportamiento` — orquestador M5 |
| `conocimiento.ts` | `obtenerPerfilConductual` (tímido, explorador, etc.) |
| `cerco-dinamico.ts` | `calcularCercoDinamico` — centro y radio ajustados |
| `radio-busqueda.ts` | `calcularRadioBusquedaTemporal` |
| `evidencia-radios.ts` | `estimarRadioConEvidencia`, `parametrosExpansionTemporal` |
| `zonas-refugio.ts` | `identificarZonasRefugio`, `identificarZonasRefugioConAvistamientos` |
| `contexto-busqueda.ts` | `accesoExterior`, `resolverContextoBusqueda` |
| `consejos.ts` | `generarConsejosBusqueda` |
| `fuentes.ts` | Referencias bibliográficas calibración |

### Campo BD

`mascota.acceso_exterior` — `solo_interior` | `patio_supervisado` | `exterior_habitual` (migración `0008`).

---

## M6 — Avistamientos, casos, chat y notificaciones

Reportes de avistamiento, verificación por el dueño, chat privado por avistamiento, timeline del caso y campana de notificaciones.

### Rutas

| Ruta | Descripción |
|------|-------------|
| `/avistamiento/[id]` | Detalle y chat del avistamiento |
| `/mis-mascotas/[id]/caso` | Panel de chats estilo WhatsApp |
| `/notificaciones` | Historial de notificaciones |
| Modal global | Reportar avistamiento (cualquier ruta) |

### Server Actions — `src/actions/avistamientos.ts`

| Función | Descripción |
|---------|-------------|
| `crearAvistamiento` | Alta con geo, foto, vínculo opcional a mascota |
| `listarAvistamientosPorMascota` | Timeline de una ficha |
| `gestionarEstadoAvistamiento` | `PENDIENTE` → `VERIFICADO` / `DESCARTADO` |
| `enviarMensajeAvistamiento` | Mensaje en chat del avistamiento |
| `listarMascotasPerdidasParaSelector` | Selector al reportar |
| `esDuenoDeFicha` | ¿Sesión participa como dueña del caso? |

### Server Actions — `src/actions/casos.ts`

| Función | Descripción |
|---------|-------------|
| `puedeAccederPanelCoordinacionMascota` | Dueño o admin |
| `puedeAccederChatAvistamiento` | Dueño (todos los hilos) o autor del reporte o admin |
| `obtenerPanelCoordinacion` | Panel del dueño: reportes + conversaciones |
| `obtenerChatPrivadoAvistamiento` | Mensajes de un avistamiento |
| `marcarChatLeido` | Marca lecturas |
| `reportarComportamientoSospechoso` | Reporte de abuso → admin (M7) |
| `listarConversaciones` | Chats accesibles (una fila por reporte) |

### Server Actions — `src/actions/notificaciones.ts`

| Función | Descripción |
|---------|-------------|
| `contarNotificacionesNoLeidas` | Badge campana |
| `listarNotificacionesUsuario` | Listado paginado |
| `marcarNotificacionLeida` | Una notificación |
| `marcarTodasNotificacionesLeidas` | Limpiar badge |

### Server Actions — `src/actions/resumen-casos-nav.ts`

| Función | Descripción |
|---------|-------------|
| `obtenerResumenCasosNav` | Contadores para navegación / perfil |

### Librería — `src/lib/casos/servicio-caso.ts`

| Función | Descripción |
|---------|-------------|
| `crearNotificacionPrivada` | Inserta en BD + WS `notificacion:nueva` |
| `registrarEventoCaso` | Timeline (`evento_caso`) |
| `registrarCoincidenciaIaDueno` | Notifica coincidencia M3 |
| `notificarAdministradoresAbuso` | Alerta M7 por reporte de chat |
| `usuarioAceptaNotificacionesInApp` / `Email` | Preferencias usuario |

### Librería — `src/lib/avistamientos/`

| Archivo | Contenido |
|---------|-----------|
| `borrador-cliente.ts` | Borrador avistamiento sin sesión |

### Email M6

| Función | Uso |
|---------|-----|
| `enviarCorreoAvistamientoNuevo` | Aviso al dueño |
| `enviarCorreoMensajeChat` | Nuevo mensaje en chat |
| `plantillaAvistamientoNuevo` / `plantillaMensajeChatAvistamiento` | Plantillas HTML |

### Estados de avistamiento

`PENDIENTE` · `VERIFICADO` · `DESCARTADO`

### Tipos de notificación

`AVISTAMIENTO_NUEVO` · `AVISTAMIENTO_VERIFICADO` · `AVISTAMIENTO_DESCARTADO` · `MENSAJE_NUEVO` · `COINCIDENCIA_IA` · `ESTADO_CASO` · `CASO_RECUPERADO` · `REPORTE_ABUSO_ADMIN`

### Componentes clave

| Componente | Rol |
|------------|-----|
| `PanelChatsCaso.tsx` | Lista + chat (layout WhatsApp) |
| `ChatPrivadoCaso.tsx` | Burbujas, envío, reportar abuso |
| `VistaCoordinacion.tsx` | Panel de coordinación del dueño |
| `TimelineAvistamientos.tsx` | Línea de tiempo ficha pública |
| `CampanaNotificaciones.tsx` | Dropdown campana |

---

## M7 — Panel administrativo

Dashboard de supervisión: KPIs, moderación, usuarios, mapa de calor admin y exportaciones CSV.

### Rutas

| Ruta | Acceso |
|------|--------|
| `/admin` | Solo `ADMINISTRADOR` |
| `/api/admin/export?tipo=` | CSV (requiere sesión admin) |

Admin automático: **`paw.patrol.soporte@gmail.com`**.

### Server Actions — `src/actions/admin.ts`

| Función | Descripción |
|---------|-------------|
| `obtenerEstadisticasAdmin` | KPIs globales (usuarios, mascotas, perdidas, etc.) |
| `obtenerMetricasAdmin` | Reuniones del mes, tiempo medio, top colaboradores |
| `obtenerDatosMapaAdmin` | Datos mapa completo para calor admin |
| `listarAvistamientosAdmin` | Últimos avistamientos |
| `listarReportesAbusoAdmin` | Cola de moderación (chats) |
| `actualizarEstadoReporteAbuso` | `RESUELTO` / `DESCARTADO` |
| `listarUsuariosAdmin` | Búsqueda + conteos mascotas/avistamientos |
| `alternarUsuarioActivo` | Desactivar/reactivar cuenta (`activo`) |
| `exportarCsvAdmin` | Genera CSV según tipo |

Tipos export: `avistamientos` · `usuarios` · `mascotas-perdidas` · `reportes`

### API REST

| Método | Ruta | Query | Archivo descargado |
|--------|------|-------|-------------------|
| `GET` | `/api/admin/export` | `tipo=avistamientos` | `pawpatrol-avistamientos.csv` |
| `GET` | `/api/admin/export` | `tipo=usuarios` | `pawpatrol-usuarios.csv` |
| `GET` | `/api/admin/export` | `tipo=mascotas-perdidas` | `pawpatrol-mascotas-perdidas.csv` |
| `GET` | `/api/admin/export` | `tipo=reportes` | `pawpatrol-reportes-abuso.csv` |

### Componentes — `src/componentes/admin/`

| Componente | Rol |
|------------|-----|
| `MapaAdminPanel.tsx` | Mapa Leaflet + calor dedicado admin |
| `ModeracionReportes.tsx` | Resolver / descartar reportes |
| `TablaUsuariosAdmin.tsx` | Buscar y desactivar usuarios |

### Migración

```bash
npm run db:migrate-usuario-activo   # 0011 — columna user.activo
```

---

## Mapa de dependencias entre módulos

```
M1 (auth) ──────────────────────────────────────────────┐
                                                        ▼
M2 (fichas) ──► M3 (visual) ──► M6 (notificaciones) ──► M7 (admin)
     │              │
     ├──► M4 (mapa) ◄── M6 (avistamientos)
     │         │
     └────────► M5 (comportamiento) ──► M4 / ficha pública
```

---

## Migraciones Drizzle (orden recomendado)

```bash
npm run db:push
npm run db:migrate-mapa              # 0004 — M4
npm run db:migrate-embeddings        # 0005 — M3
npm run db:migrate-embeddings-multifoto  # 0006 — M3
npm run db:migrate-comportamiento    # 0007 — M5 + avistamientos M6
npm run db:migrate-acceso-exterior   # 0008 — M5
npm run db:migrate-gemini-768        # 0009 — M3
npm run db:migrate-notificaciones    # 0010 — M6
npm run db:migrate-usuario-activo    # 0011 — M1/M7
```

Archivos SQL en `drizzle/0000` … `drizzle/0011`.

---

## Índice rápido de archivos `src/actions/`

| Archivo | Módulo |
|---------|--------|
| `autenticacion.ts` | M1 |
| `mascotas.ts` | M2 |
| `estadisticas.ts` | M2 (landing) |
| `mapa.ts` | M4 + predicción M5 |
| `comunidad.ts` | M4 |
| `avistamientos.ts` | M6 |
| `casos.ts` | M6 |
| `notificaciones.ts` | M6 |
| `resumen-casos-nav.ts` | M6 |
| `admin.ts` | M7 |

---

Documentación general del proyecto: [README.md](./README.md)
