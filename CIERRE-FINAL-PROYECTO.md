# Cierre final del proyecto Mission Control

## Objetivo
Cerrar el proyecto en una secuencia corta, ejecutable y profesional, separando:

- trabajo ya resuelto en código
- validaciones pendientes
- pasos manuales de producción
- criterio de salida para declarar v1 cerrada

---

## Estado actual
Ya existe una base funcional avanzada con:

- Mission Control
- misiones
- flujos
- espacios
- membresías y roles básicos
- gobernanza por espacio
- aprobaciones
- auditoría
- trazabilidad visible de espacio
- integración visible con OpenClaw
- oficina operativa estabilizada

El principal riesgo actual ya no es de implementación base, sino de:

- despliegue desalineado
- esquema de base real incompleto
- QA no ejecutado extremo a extremo

---

## Orden recomendado de cierre

### Fase 1. Sincronizar producción
Primero hay que alinear la instancia pública con el código actual.

### Fase 2. Ejecutar QA funcional real
Usar `QA-CHECKLIST-MISSION-CONTROL.md` y validar módulos clave en el panel público.

### Fase 3. Corregir hallazgos
Solo después de la validación real conviene arreglar bugs residuales.

### Fase 4. Declarar v1 cerrada
Cuando producción, QA y gobernanza mínima estén coherentes.

---

## 1. Pasos manuales obligatorios en el VPS
Estos pasos no los puedo completar yo directamente porque requieren despliegue real y posiblemente `sudo`.

### 1.1 Actualizar repo
```bash
cd /home/ubuntu/centro-comando-agentes-ia
git pull --ff-only origin main
```

### 1.2 Reinstalar dependencias si hiciera falta
```bash
cd /home/ubuntu/centro-comando-agentes-ia/backend && npm install
cd /home/ubuntu/centro-comando-agentes-ia/frontend && npm install
```

### 1.3 Aplicar esquema actual a la base real
```bash
psql postgres://postgres:postgres@localhost:5432/centro_comando_agentes_ia -f /home/ubuntu/centro-comando-agentes-ia/database/schema.sql
psql postgres://postgres:postgres@localhost:5432/centro_comando_agentes_ia -f /home/ubuntu/centro-comando-agentes-ia/database/seed.sql
```

### 1.4 Confirmar tablas críticas
```bash
psql postgres://postgres:postgres@localhost:5432/centro_comando_agentes_ia -c "\dt ai_*"
```

Debe existir al menos:

- `ai_missions`
- `ai_workflow_templates`
- `ai_workspaces`
- `ai_users`
- `ai_workspace_memberships`

### 1.5 Rebuild backend y frontend
```bash
cd /home/ubuntu/centro-comando-agentes-ia/backend && npm run build
cd /home/ubuntu/centro-comando-agentes-ia/frontend && npm run build
```

### 1.6 Publicar frontend compilado
Si nginx sirve archivos estáticos, copiar o sincronizar `frontend/dist` a la ruta real publicada.

### 1.7 Reiniciar backend
```bash
sudo systemctl restart centro-comando-backend.service
sudo systemctl status centro-comando-backend.service --no-pager
```

### 1.8 Recargar nginx si hace falta
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 2. Verificación inmediata post-deploy

### Health y runtime
```bash
curl -fsS https://panel.hacktrickstore.com/api/system/health
curl -fsS https://panel.hacktrickstore.com/api/system/openclaw/status
```

### Endpoints críticos
```bash
curl -fsS https://panel.hacktrickstore.com/api/missions
curl -fsS https://panel.hacktrickstore.com/api/workflows
curl -fsS https://panel.hacktrickstore.com/api/workspaces
curl -fsS https://panel.hacktrickstore.com/api/approvals
curl -fsS https://panel.hacktrickstore.com/api/audit
```

Si alguno devuelve `404`, `500` o HTML en vez de JSON, producción sigue desalineada.

---

## 3. QA funcional mínimo para declarar v1 operable
Ejecutar el archivo:

- `QA-CHECKLIST-MISSION-CONTROL.md`

### foco mínimo obligatorio
- Dashboard
- Misiones
- Flujos
- Espacios
- Tareas
- Ejecuciones
- Aprobaciones
- Auditoría

### flujo mínimo recomendado
1. Crear espacio
2. Añadir miembro
3. Crear misión ligada a espacio
4. Lanzar flujo ligado a espacio
5. Ejecutar tarea ligada a espacio
6. Revisar aprobación ligada a espacio
7. Confirmar trazabilidad en auditoría
8. Confirmar visibilidad de espacio en dashboard

---

## 4. Criterio para declarar v1 cerrada
Se puede declarar v1 cerrada si se cumple todo esto:

- [ ] producción responde con la versión actual
- [ ] endpoints críticos devuelven JSON correcto
- [ ] esquema real está alineado con `database/schema.sql`
- [ ] `QA-CHECKLIST-MISSION-CONTROL.md` queda ejecutado
- [ ] no hay residuos importantes de inglés en UI principal
- [ ] las rutas de gobernanza por espacio funcionan en producción
- [ ] auditoría muestra espacio y rol en eventos relevantes

---

## 5. Qué NO hace falta antes de cerrar v1
No hace falta bloquear el cierre por:

- RBAC ultra fino en todos los módulos
- oficina 2D súper avanzada
- tiempo real completo
- builder visual avanzado de workflows
- integración OpenClaw más profunda que la verificada hoy

Eso puede quedar para v1.1 o v2.

---

## 6. Siguiente fase después del cierre
Una vez cerrada v1, el siguiente bloque más lógico sería:

- permisos más completos en módulos restantes
- workflow builder más rico
- integración OpenClaw más profunda
- mejoras de simulación/oficina
- endurecimiento de tiempo real y observabilidad
