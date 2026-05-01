# QA Checklist Mission Control

## Objetivo
Validar de extremo a extremo que Mission Control ya funciona de forma consistente en:

- misiones
- flujos
- espacios
- membresías y roles
- tareas
- ejecuciones
- aprobaciones
- auditoría
- dashboard
- integración visible con OpenClaw

---

## 1. Sanidad base del entorno

### Backend
- [ ] `cd /home/ubuntu/centro-comando-agentes-ia/backend && npm run build`
- [ ] El build termina sin errores.

### Frontend
- [ ] `cd /home/ubuntu/centro-comando-agentes-ia/frontend && npm run build`
- [ ] El build termina sin errores.

### Base de datos
- [ ] Confirmar que existen tablas `ai_missions`, `ai_workflow_templates`, `ai_workspaces`, `ai_users`, `ai_workspace_memberships`.
- [ ] Confirmar que no hay errores al leer `missions`, `workflows` y `workspaces` desde la API.

### Producción
- [ ] `https://panel.hacktrickstore.com/api/system/health` responde correctamente.
- [ ] `https://panel.hacktrickstore.com/api/system/openclaw/status` responde correctamente.

---

## 2. Dashboard / Mission Control

- [ ] La cola principal de misiones muestra columna **Espacio**.
- [ ] El panorama de control muestra el indicador **Misiones con espacio asignado**.
- [ ] El dashboard no mezcla etiquetas visibles en inglés.
- [ ] El bloque de OpenClaw muestra estado, validación y último registro visible.

---

## 3. Espacios

### Alta básica
- [ ] Se puede crear un espacio nuevo.
- [ ] El espacio aparece en la tabla principal.
- [ ] El owner inicial queda visible en la matriz de roles.

### Membresías
- [ ] Se puede añadir un miembro desde `+Miembro`.
- [ ] El rol aparece en la tabla y en los chips.
- [ ] Solo propietario o administrador pueden gestionar membresías.
- [ ] Un actor sin permisos recibe bloqueo correcto del backend.

---

## 4. Misiones

### Creación
- [ ] Se puede crear misión sin espacio.
- [ ] Se puede crear misión ligada a un espacio.
- [ ] La misión muestra **Origen** y **Espacio** en la bandeja.
- [ ] El detalle de misión muestra **Origen operativo** y **Espacio operativo**.

### Gobernanza
- [ ] Si el actor no tiene rol operativo en el espacio, la creación se bloquea.
- [ ] Solo propietario, administrador u operador pueden iniciar, pausar, reanudar o cancelar una misión ligada a espacio.
- [ ] El feedback de error es comprensible cuando la acción es rechazada por permisos.

---

## 5. Flujos

### Biblioteca
- [ ] La biblioteca de flujos carga correctamente.
- [ ] Se puede crear una plantilla de flujo nueva.
- [ ] La plantilla muestra prioridad, modo recomendado y pasos.

### Lanzamiento
- [ ] Se puede lanzar flujo sin espacio.
- [ ] Se puede lanzar flujo con espacio.
- [ ] Si el actor no tiene rol operativo en ese espacio, el lanzamiento se bloquea.
- [ ] La misión resultante conserva `workflowId`, `workflowName`, `workspaceId` y `workspaceName`.

---

## 6. Tareas

- [ ] La bandeja de tareas muestra columna **Espacio**.
- [ ] Las tareas nacidas desde misión/flujo conservan su espacio en metadata.
- [ ] Ejecutar tarea desde bandeja funciona con actor explícito.
- [ ] Ejecutar tarea desde detalle funciona con actor explícito.
- [ ] Si la tarea pertenece a un espacio y el actor no tiene rol operativo, la ejecución se bloquea.

---

## 7. Ejecuciones

- [ ] La bandeja de ejecuciones muestra columna **Espacio**.
- [ ] El panel lateral de última ejecución muestra **Espacio**.
- [ ] Las ejecuciones derivadas de tareas con espacio mantienen coherencia visual.
- [ ] Cancelar o reencolar runs no rompe la consistencia visual del módulo.

---

## 8. Aprobaciones

- [ ] La bandeja de aprobaciones muestra columna **Espacio**.
- [ ] El panel lateral de resumen muestra **Espacio**.
- [ ] Aprobar, rechazar y ejecutar aprobaciones ligadas a espacio respetan permisos operativos.
- [ ] El payload visible conserva riesgo, modo, acciones sensibles y espacio.

---

## 9. Auditoría

- [ ] La auditoría muestra columnas **Espacio** y **Rol**.
- [ ] Los eventos de gobernanza por espacio son visibles.
- [ ] La lectura rápida muestra espacio y rol del evento principal.
- [ ] Eventos esperados aparecen en auditoría:
  - [ ] `mission_created`
  - [ ] `mission_started`
  - [ ] `mission_paused`
  - [ ] `mission_resumed`
  - [ ] `mission_cancelled`
  - [ ] `workspace_created`
  - [ ] `workspace_updated`
  - [ ] `workspace_membership_created`
  - [ ] `task_run_completed`
  - [ ] `task_run_failed`

---

## 10. Idioma y consistencia visual

- [ ] No quedan labels operativos visibles en inglés en módulos principales.
- [ ] Los términos visibles son consistentes entre Dashboard, Misiones, Flujos, Espacios, Tareas, Ejecuciones, Aprobaciones y Auditoría.
- [ ] El patrón de tabla compacta se mantiene coherente.

---

## 11. Cierre antes de producción

- [ ] Actualizar base real con `database/schema.sql` si hay cambios pendientes.
- [ ] Reiniciar backend con `sudo systemctl restart centro-comando-backend.service`.
- [ ] Verificar manualmente UI pública en `panel.hacktrickstore.com`.
- [ ] Confirmar que misiones, flujos y espacios ya funcionan en producción sin 404 ni errores de esquema.

---

## Prioridad recomendada de ejecución

### Alta prioridad
1. Espacios y membresías
2. Misiones con espacio
3. Flujos con espacio
4. Tareas y ejecuciones con espacio
5. Aprobaciones con espacio
6. Auditoría visible

### Media prioridad
7. Dashboard
8. Idioma y consistencia visual
9. Verificaciones de producción

---

## Resultado esperado
Al cerrar este checklist, Mission Control debería quedar con:

- trazabilidad visible de espacio extremo a extremo
- gobernanza operativa básica por rol
- coherencia entre frontend, backend y auditoría
- menor riesgo de romper producción por esquema o despliegue incompleto
