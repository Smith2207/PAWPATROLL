# Modelo de actores, reportes y chat — PawPatrol

Este documento explica la lógica del sistema entre base de datos, código e interfaz.

**Idea central:** cada **conversación** está ligada 1:1 a un **reporte de avistamiento**. El dueño de la mascota puede tener varias conversaciones (una por reporte recibido); el reportante solo accede a la de su propio reporte.

---

## 1. Módulos del dominio

| Módulo | Responsabilidad | Rutas / tablas |
|--------|-----------------|----------------|
| **Reportes** | Alta y gestión de avistamientos | `avistamiento`, `/api/avistamiento/*` |
| **Chat** | Mensajes por reporte | `mensaje_avistamiento`, `/avistamiento/[id]`, `/chats` |
| **Casos** | Coordinación del dueño (todos los reportes de una mascota) | `evento_caso`, `/mis-mascotas/[id]/caso` |

---

## 2. Conversación ↔ reporte

```
reporte (avistamiento)
  └── conversación (mensaje_avistamiento.avistamiento_id)
        ├── dueño de la mascota → acceso a TODOS los hilos de su ficha
        └── reportante → acceso SOLO al hilo de su reporte
```

| Regla | Código |
|-------|--------|
| Acceder a un reporte | `lib/reportes/acceso.ts` → `puedeAccederReporte` |
| Acceder a una conversación | `lib/chat/acceso.ts` → `puedeAccederConversacion` (mismas reglas) |
| Panel de coordinación (dueño) | `lib/casos/acceso.ts` → `puedeAccederPanelCoordinacion` |

---

## 3. Rol de cuenta (`user.rol`)

| Valor | Quién | Para qué |
|-------|-------|----------|
| `USUARIO` | Cualquier registrado | Fichas, reportes, chats, mapa, IA |
| `ADMINISTRADOR` | Soporte | `/admin`, moderación, supervisión |

No hay rol «dueño» en la cuenta: se deduce de `mascota.user_id`.

---

## 4. Participación en un hilo

| Papel | Definición |
|-------|------------|
| **Dueño** | `mascota.user_id === sesión.user.id` |
| **Testigo** | `avistamiento.user_id === sesión.user.id` (autor del reporte) |

Un mismo usuario puede ser dueño en una mascota y testigo en el reporte de otro.

---

## 5. Qué muestra la interfaz

| Lugar | Contenido |
|-------|-----------|
| `/chats` | Lista de conversaciones (una fila por reporte) |
| `/mis-mascotas/[id]/caso` | Panel del dueño: todos los reportes y sus chats |
| `/avistamiento/[id]` | Chat de un reporte concreto |
| Chat | Badge «Dueño» / «Testigo» según participación en ese hilo |

---

## 6. Quién puede hacer qué (mascotas perdidas)

| Acción | Dueño de la ficha | Cualquier usuario logueado |
|--------|-------------------|----------------------------|
| Crear ficha y marcar PERDIDA | Sí (sus mascotas) | Sí (sus mascotas) |
| Reportar avistamiento en el mapa | Sí | Sí |
| Reportar avistamiento vinculado a una ficha ajena | Sí | Sí (queda como testigo) |
| Chat del reporte | Todos los hilos de su mascota | Solo el hilo de su propio reporte |
| Verificar / descartar reporte | Sí | No |
| Panel de coordinación | Sí | No |

## 7. Funciones y módulos clave

| Módulo | Archivo | Uso |
|--------|---------|-----|
| Reportes | `lib/reportes/acceso.ts` | `puedeAccederReporte`, `puedeGestionarReporte` |
| Chat | `lib/chat/acceso.ts`, `actions/chat/` | Conversación 1:1 por reporte |
| Consultas | `lib/avistamientos/consultas.ts` | Listados reutilizables |
| Casos | `lib/casos/participacion.ts`, `actions/casos/panel-coordinacion.ts` | Dueño y coordinación |
| UI chat | `lib/casos/papel.ts`, `lib/chat/participantes.ts` | Sin BD (cliente seguro) |

## 8. Base de datos

- `historial_estado_mascota` — se escribe en cada cambio de estado de la mascota.
- Índice único `(mascota_id, numero_reporte)` — un número de reporte por mascota.
- Migración: `npm run db:migrate-integridad` (0014).
