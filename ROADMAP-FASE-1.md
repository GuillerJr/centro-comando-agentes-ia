# FASE 1 - Operación fuerte

## Objetivo
Convertir el centro de comando en una superficie de trabajo diaria más rápida, trazable y útil para operación real, antes de introducir capas más complejas de gobernanza, automatización y simulación.

## Resultado esperado
Al cerrar esta fase, el panel debe permitir:
- encontrar entidades rápido
- operar sobre grupos de registros
- entender la relación entre tareas, runs, aprobaciones y auditoría
- modelar trabajo dependiente sin improvisación manual
- leer mejor la presión operativa del sistema

---

## Bloques de producto

### 1. Búsqueda global
Permitir una búsqueda transversal desde el shell principal para navegar y localizar:
- tareas
- runs
- agentes
- skills
- aprobaciones
- settings
- servidores MCP

#### Alcance inicial
- búsqueda unificada por texto
- resultados agrupados por tipo de entidad
- click para abrir detalle o vista correspondiente
- sin ranking semántico todavía, solo matching determinista útil

#### Backend
- nuevo endpoint agregado, por ejemplo:
  - `GET /api/system/search?q=...`
- consolidación de consultas por entidad
- límite por categoría para no cargar demasiado el payload

#### Frontend
- input global en topbar
- dropdown de resultados
- navegación directa a módulo o detalle

#### Base de datos
- no requiere tablas nuevas
- sí conviene revisar índices de texto básicos más adelante

---

### 2. Filtros persistentes y vistas guardadas
Ya hay filtros en varias vistas, pero falta persistir y reutilizar contexto.

#### Alcance inicial
- persistir filtros por módulo en local storage
- restaurar último estado al volver
- permitir guardar 1-3 vistas rápidas por módulo en una etapa posterior corta

#### Frontend
- capa reutilizable para estado de filtros
- normalizar estructura de filtros por página

#### Backend
- opcional en subfase inicial
- persistencia local primero, servidor después

---

### 3. Bulk actions
Operar por lote sobre registros críticos.

#### Módulos prioritarios
- tareas
- agentes
- skills
- aprobaciones

#### Acciones iniciales
- tareas:
  - cambiar estado
  - cancelar varias
  - reintentar varias cuando aplique
- agentes:
  - activar/desactivar varios
  - subir/bajar prioridad base
- skills:
  - activar/desactivar varias
- aprobaciones:
  - aprobar/rechazar varias solo si el flujo lo permite

#### Backend
Nuevos endpoints bulk, por ejemplo:
- `POST /api/tasks/bulk/status`
- `POST /api/agents/bulk/status`
- `POST /api/skills/bulk/status`
- `POST /api/approvals/bulk/review`

#### Frontend
- selección por checkbox en tablas
- barra de acciones masivas
- confirmación antes de aplicar

#### Riesgo
- evitar acciones masivas destructivas sin confirmación clara

---

### 4. Dependencias entre tareas
Ahora las tareas existen como unidades relativamente aisladas. Falta modelar relación operativa.

#### Objetivo
Permitir que una tarea dependa de otra antes de avanzar.

#### Modelo inicial
- dependencia tipo bloqueante entre tareas
- estados derivados simples:
  - lista para iniciar
  - bloqueada
  - desbloqueada

#### Base de datos
Nueva tabla sugerida:
- `ai_task_dependencies`
  - id
  - task_id
  - depends_on_task_id
  - dependency_type (`blocks`, luego extensible)
  - created_at

#### Backend
- crear dependencia
- eliminar dependencia
- listar dependencias por tarea
- validación para evitar autoreferencia y ciclos obvios

#### Frontend
- mostrar dependencias en detalle de tarea
- permitir enlazar/desenlazar tareas
- reflejar si una tarea está bloqueada

#### Riesgo
- ciclos y complejidad creciente
- en Fase 1 solo validar casos básicos

---

### 5. Subtareas
Dar estructura a trabajo grande sin meter aún workflows complejos.

#### Modelo inicial
Dos opciones válidas:
1. tabla separada de subtareas
2. tarea padre-hija en la misma entidad

#### Recomendación
Usar relación padre-hija en `ai_tasks` con:
- `parent_task_id UUID NULL`

#### Resultado
- una tarea puede agrupar subtareas
- el detalle debe mostrar jerarquía básica
- la vista Tasks puede filtrar padres/hijas

#### Backend
- soportar crear tarea con padre
- listar hijas de una tarea

#### Frontend
- bloque de subtareas en TaskDetail
- crear subtarea desde detalle

---

### 6. Timeline unificado
Muy importante. Es de las piezas con más valor.

#### Objetivo
Ver una línea temporal consolidada de:
- tarea creada
- run disparado
- aprobación emitida
- aprobación resuelta
- run completado/fallido
- eventos de auditoría relacionados

#### Alcance inicial
- timeline por tarea
- timeline global reciente

#### Backend
Nuevo endpoint sugerido:
- `GET /api/system/timeline`
- `GET /api/tasks/:taskId/timeline`

#### Implementación
Construir timeline derivado unificando:
- `ai_tasks`
- `ai_task_runs`
- `ai_approvals`
- `ai_audit_logs`

#### Frontend
- vista timeline compacta
- filtros por tipo de evento
- orden descendente al inicio

---

### 7. Métricas operativas mejores
No solo totales. Métricas útiles para decidir.

#### Métricas objetivo
- tasa de éxito por agente
- duración media por tipo de tarea
- tasa de fallo por tipo de tarea
- runs por modo (`mock/cli/api`)
- backlog bloqueado por dependencias
- carga por agente

#### Backend
- ampliar payload de dashboard
- métricas calculadas en servicio

#### Frontend
- dashboard más ejecutivo
- tablas/resúmenes compactos

---

## Orden recomendado de implementación dentro de Fase 1

### F1.1
- persistencia simple de filtros
- búsqueda global
- quick improvements del shell

### F1.2
- bulk actions para tareas/agentes/skills

### F1.3
- dependencias entre tareas
- tarea bloqueada / desbloqueada

### F1.4
- subtareas
- mejoras del detalle de tarea

### F1.5
- timeline unificado
- mejoras del dashboard y trazabilidad

### F1.6
- métricas operativas reforzadas
- cierre y QA de fase

---

## Capas afectadas

### Frontend
- `src/App.tsx`
- `src/components/ui.tsx`
- `src/pages/TasksPage.tsx`
- `src/pages/TaskDetailPage.tsx`
- `src/pages/DashboardPage.tsx`
- `src/pages/AgentsPage.tsx`
- `src/pages/SkillsPage.tsx`
- `src/pages/ApprovalsPage.tsx`
- posible componente nuevo de búsqueda global
- posible componente nuevo de bulk toolbar
- posible componente nuevo de timeline

### Backend
- `routes/tasks.routes.ts`
- `controllers/tasks.controller.ts`
- `services/command-center.service.ts`
- `repositories/command-center.repository.ts`
- nuevas rutas de búsqueda/timeline/bulk
- validaciones nuevas en schemas

### Database
Cambios probables:
- `ai_tasks.parent_task_id`
- `ai_task_dependencies`
- índices adicionales según consultas

---

## Riesgos
- crecer demasiado el alcance si metemos workflows avanzados demasiado pronto
- duplicar semántica entre subtareas y dependencias
- sobrecargar la UX si bulk actions y timeline no quedan claros
- romper consistencia si no se valida bien el estado bloqueado de tareas

---

## Criterio de cierre de Fase 1
La fase se considera cerrada cuando:
- existe búsqueda global usable
- existen bulk actions reales en módulos principales
- tareas pueden tener dependencias
- tareas pueden tener subtareas
- existe timeline unificado mínimo
- el dashboard refleja métricas más accionables
- todo compila, navega y mantiene consistencia visual con el shell actual

---

## Recomendación inmediata
Empezar por **F1.1: búsqueda global + persistencia simple de filtros**, porque da retorno inmediato y además prepara el terreno UX para el resto de la fase.
