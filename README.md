# CENTRO DE COMANDO AGENTES IA

Plataforma web profesional para control, monitoreo y operación multiagente sobre OpenClaw.

## Propósito

Este sistema no reemplaza OpenClaw. Funciona como una capa superior de administración, monitoreo, trazabilidad, aprobaciones y operación.

## Stack

- Frontend: React + Vite + TypeScript + Tailwind CSS
- Backend: Node.js + Express + TypeScript
- Base de datos: PostgreSQL
- Validaciones: Zod

## Estructura

- `database/`: SQL real, seed y queries de prueba
- `backend/`: API REST, servicios, repositorios y adaptador OpenClaw
- `frontend/`: dashboard operativo y módulos visuales

## Integración OpenClaw

Se detectó en este entorno:
- gateway local activo en `127.0.0.1:18789`
- health real en `GET /health`
- CLI instalada en `/home/ubuntu/.openclaw/bin/openclaw`
- configuración principal en `/home/ubuntu/.openclaw/openclaw.json`

### Modos soportados

- `mock`: modo desarrollo estable, sin dependencia de OpenClaw real
- `cli`: usa whitelist de comandos permitidos de OpenClaw
- `api`: valida health real del gateway local, sin inventar endpoints adicionales

## Seguridad aplicada

- no se exponen secretos al frontend
- whitelist de comandos CLI permitidos
- acciones destructivas modeladas con aprobaciones
- logging de auditoría
- middleware preparado para autenticación futura
- separación entre UI, backend y adaptador operativo

## Variables de entorno backend

Ver `backend/.env.example`

## Puesta en marcha

### 1. Base de datos

```bash
createdb centro_comando_agentes_ia
psql postgres://postgres:postgres@localhost:5432/centro_comando_agentes_ia -f database/schema.sql
psql postgres://postgres:postgres@localhost:5432/centro_comando_agentes_ia -f database/seed.sql
psql postgres://postgres:postgres@localhost:5432/centro_comando_agentes_ia -f database/test_queries.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Endpoints clave

- `GET /api/system/health`
- `GET /api/system/dashboard`
- `GET /api/system/openclaw/status`
- `POST /api/system/openclaw/validate-connection`
- `GET /api/agents`
- `GET /api/skills`
- `GET /api/tasks`
- `POST /api/tasks/:taskId/run`
- `GET /api/task-runs`
- `GET /api/approvals`
- `GET /api/audit-logs`
- `GET /api/mcp/servers`
- `GET /api/mcp/tools`

## Observaciones técnicas

- El adapter no inventa API de OpenClaw fuera del health real detectado.
- En modo `cli`, la ejecución controlada usa únicamente comandos whitelisteados.
- En modo `api`, se deja preparada validación de conectividad y estado sin asumir endpoints de tareas inexistentes.
- El sistema presenta estado desconectado sin romper UI si OpenClaw falla.
- Segunda pasada de endurecimiento aplicada: build real de backend y frontend validado, soporte de edición UI para agentes, skills y tareas, y `VITE_API_BASE_URL` externalizado.
