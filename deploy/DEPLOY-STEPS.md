# Deploy steps for panel.hacktrickstore.com

## 0. Checklist de sincronización antes de tocar producción
Asegúrate de que el VPS ya tenga:

- `git pull --ff-only origin main`
- dependencias instaladas en `backend/` y `frontend/`
- build local validado de backend y frontend
- variables de entorno vigentes

Además, hoy hay cambios de esquema que producción debe absorber para quedar alineada con Mission Control actual:

- `ai_missions`
- `ai_workflow_templates`
- `ai_workspaces`
- `ai_users`
- `ai_workspace_memberships`

Si esos objetos no existen aún en la base real, el panel puede compilar bien pero fallar funcionalmente en:

- misiones
- flujos
- espacios
- membresías
- gobernanza por espacio

## 1. Crear o actualizar base de datos
```bash
createdb centro_comando_agentes_ia
psql postgres://postgres:postgres@localhost:5432/centro_comando_agentes_ia -f /home/ubuntu/centro-comando-agentes-ia/database/schema.sql
psql postgres://postgres:postgres@localhost:5432/centro_comando_agentes_ia -f /home/ubuntu/centro-comando-agentes-ia/database/seed.sql
```

### verificación rápida de esquema
```bash
psql postgres://postgres:postgres@localhost:5432/centro_comando_agentes_ia -c "\dt ai_*"
```

Comprueba al menos que aparecen estas tablas nuevas o críticas:

- `ai_missions`
- `ai_workflow_templates`
- `ai_workspaces`
- `ai_users`
- `ai_workspace_memberships`

## 2. Publicar backend y frontend actuales
```bash
cd /home/ubuntu/centro-comando-agentes-ia/backend && npm run build
cd /home/ubuntu/centro-comando-agentes-ia/frontend && npm run build
```

Si el despliegue usa artefactos estáticos servidos por nginx, vuelve a copiar o sincronizar `frontend/dist` a la ruta publicada real antes de recargar nginx.

## 3. Instalar o actualizar servicio backend
```bash
sudo cp /home/ubuntu/centro-comando-agentes-ia/deploy/backend.service /etc/systemd/system/centro-comando-backend.service
sudo systemctl daemon-reload
sudo systemctl enable --now centro-comando-backend.service
sudo systemctl restart centro-comando-backend.service
sudo systemctl status centro-comando-backend.service --no-pager
```

## 4. Instalar o actualizar sitio nginx
```bash
sudo cp /home/ubuntu/centro-comando-agentes-ia/deploy/nginx-panel.hacktrickstore.com.conf /etc/nginx/sites-available/panel.hacktrickstore.com
sudo ln -sf /etc/nginx/sites-available/panel.hacktrickstore.com /etc/nginx/sites-enabled/panel.hacktrickstore.com
sudo nginx -t
sudo systemctl reload nginx
```

## 5. Obtener HTTPS si todavía no existe
```bash
sudo certbot --nginx -d panel.hacktrickstore.com --redirect -m admin@hacktrickstore.com --agree-tos --no-eff-email
```

## 6. Verificación final
```bash
curl -I http://panel.hacktrickstore.com
curl -I https://panel.hacktrickstore.com
curl https://panel.hacktrickstore.com/api/system/health
curl https://panel.hacktrickstore.com/api/system/openclaw/status
curl https://panel.hacktrickstore.com/api/missions
curl https://panel.hacktrickstore.com/api/workflows
curl https://panel.hacktrickstore.com/api/workspaces
```

## 7. QA mínimo posterior al despliegue
Revisar manualmente en navegador:

- Dashboard / Mission Control
- Misiones
- Flujos
- Espacios
- Aprobaciones
- Auditoría

Validar especialmente:

- creación de misión
- lanzamiento de flujo
- visualización de espacios y membresías
- trazabilidad por espacio/rol en auditoría
