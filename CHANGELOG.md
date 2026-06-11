# Changelog — PawPatrol

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

## [0.1.0] — 2026-06

### Añadido

- Plataforma comunitaria para reportar pérdidas y avistamientos de mascotas.
- Módulos M1–M7: autenticación, fichas, búsqueda visual IA, mapa, comportamiento predictivo, casos/chat y admin.
- Auth.js con correo/contraseña y Google OAuth.
- Mapa Leaflet con cercos, calor y refugios (M5).
- Búsqueda por foto con Gemini Embedding 768d (respaldo CLIP).
- Chat privado dueño ↔ testigo por avistamiento.
- WebSocket en desarrollo y servicio Railway en producción.
- Panel administrativo con export CSV.
- Documentación del sistema (`docs/DOCUMENTACION_DEL_SISTEMA.md`).
- Especificación OpenAPI (`docs/openapi.yaml`).

### Cambiado

- Roles simplificados: solo `USUARIO` y `ADMINISTRADOR` (eliminados CIUDADANO y DUENO).
- Consolidación de modales de reporte y código duplicado.
- Búsqueda de lugares estilo Google Maps (Places Autocomplete + Details).
- Geolocalización «Ubicarme» solo con GPS del navegador.

### Seguridad

- Rate limit en APIs sensibles (IA, geo).
- Tokens HMAC para WebSocket.
- Hooks Git para evitar co-autor de IA en commits.

### Corregido

- Geolocalización incorrecta por IP en cliente.
- Build Vercel con onnxruntime-node (shim WASM).
