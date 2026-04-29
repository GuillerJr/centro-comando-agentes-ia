INSERT INTO ai_skills (id, canonical_name, conversational_alias, description, skill_type, status, when_to_use, when_not_to_use, related_skills, quality_checklist)
VALUES
('10000000-0000-0000-0000-000000000001', 'agent-skill-governance', 'skill_governance', 'Gobierna routing, límites y orden de skills.', 'governance', 'active', 'Usar cuando hay trabajo multicapa o riesgo de solapamiento.', 'No usar para implementar código.', ARRAY['project-orchestrator-senior', 'multi-agent-architect'], ARRAY['definir skill líder', 'definir orden', 'definir límites']),
('10000000-0000-0000-0000-000000000002', 'project-orchestrator-senior', 'project_orchestrator_senior', 'Coordina entregas multicapa y coherencia integral.', 'architecture', 'active', 'Usar para organizar alcance, fases y checklist de proyectos grandes.', 'No usar como reemplazo de arquitectura profunda ni implementación total.', ARRAY['multi-agent-architect', 'system-design-expert'], ARRAY['alcance claro', 'plan por capas', 'checklist final']),
('10000000-0000-0000-0000-000000000003', 'multi-agent-architect', 'multi_agent_architect', 'Define secuencia y reparto entre skills.', 'architecture', 'active', 'Usar cuando intervienen varias skills especializadas.', 'No usar para programar ni diseñar arquitectura profunda.', ARRAY['system-design-expert', 'fullstack-feature-builder'], ARRAY['secuencia definida', 'sin solapamientos']),
('10000000-0000-0000-0000-000000000004', 'system-design-expert', 'system_design_expert', 'Diseña arquitectura implementable.', 'architecture', 'active', 'Usar para entidades, contratos, flujos y seguridad.', 'No usar para coordinar agentes o implementar toda la solución.', ARRAY['postgresql-database-expert', 'backend-engineer-expert'], ARRAY['modelo claro', 'contratos claros']),
('10000000-0000-0000-0000-000000000005', 'fullstack-feature-builder', 'fullstack_feature_builder', 'Implementa funcionalidad end-to-end.', 'fullstack', 'active', 'Usar cuando alcance y arquitectura ya están claros.', 'No usar para reemplazar gobernanza o arquitectura.', ARRAY['frontend-engineer-expert', 'backend-engineer-expert'], ARRAY['feature completa', 'sin TODOs'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_agents (id, name, description, agent_type, status, skill_ids, priority, execution_limit, last_activity_at, metadata)
VALUES
('20000000-0000-0000-0000-000000000001', 'LokiClaw', 'Arquitecto-orquestador principal del centro de comando.', 'orchestrator', 'active', ARRAY['10000000-0000-0000-0000-000000000001'::uuid, '10000000-0000-0000-0000-000000000002'::uuid, '10000000-0000-0000-0000-000000000003'::uuid], 95, 10, NOW(), '{"owner":"Guiller"}'::jsonb),
('20000000-0000-0000-0000-000000000002', 'OpenClaw Runtime', 'Representación operativa del motor OpenClaw subyacente.', 'executor', 'active', ARRAY['10000000-0000-0000-0000-000000000005'::uuid], 90, 20, NOW(), '{"mode":"local-gateway"}'::jsonb),
('20000000-0000-0000-0000-000000000003', 'Nora Review', 'Especialista en validación, auditoría y criterios de aprobación.', 'observer', 'active', ARRAY['10000000-0000-0000-0000-000000000001'::uuid, '10000000-0000-0000-0000-000000000004'::uuid], 82, 6, NOW(), '{"focus":"approval-flow"}'::jsonb),
('20000000-0000-0000-0000-000000000004', 'Iris UI', 'Especialista en experiencia visual y consistencia de interfaz.', 'specialist', 'active', ARRAY['10000000-0000-0000-0000-000000000005'::uuid], 78, 5, NOW(), '{"focus":"frontend"}'::jsonb),
('20000000-0000-0000-0000-000000000005', 'Atlas Data', 'Especialista en contratos backend, persistencia y consultas SQL.', 'specialist', 'active', ARRAY['10000000-0000-0000-0000-000000000004'::uuid, '10000000-0000-0000-0000-000000000005'::uuid], 84, 5, NOW(), '{"focus":"backend-database"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_tasks (id, title, description, priority, task_type, lead_skill_id, support_skill_ids, status, result_summary, logs, created_by, started_at, completed_at, metadata)
VALUES
('30000000-0000-0000-0000-000000000001', 'Auditar skills del sistema', 'Revisar routing, límites y responsabilidades del stack activo.', 'high', 'documentation', '10000000-0000-0000-0000-000000000001', ARRAY['10000000-0000-0000-0000-000000000002'::uuid], 'completed', 'Gobernanza validada', 'Revisión completada sin conflictos críticos.', 'system', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '90 minutes', '{"source":"seed"}'::jsonb),
('30000000-0000-0000-0000-000000000002', 'Validar conectividad OpenClaw', 'Verificar gateway local y modo operativo.', 'critical', 'infrastructure', '10000000-0000-0000-0000-000000000004', ARRAY['10000000-0000-0000-0000-000000000005'::uuid], 'running', 'En validación', 'Health y gateway revisándose.', 'system', NOW() - INTERVAL '15 minutes', NULL, '{"source":"seed"}'::jsonb),
('30000000-0000-0000-0000-000000000003', 'Diseñar backend espacial inicial', 'Definir modelos, layout base y endpoints mínimos para la oficina digital.', 'high', 'fullstack', '10000000-0000-0000-0000-000000000004', ARRAY['10000000-0000-0000-0000-000000000005'::uuid], 'running', 'Implementación en curso', 'Dominio espacial en construcción.', 'Guiller', NOW() - INTERVAL '35 minutes', NULL, '{"source":"seed","initiative":"office-v1"}'::jsonb),
('30000000-0000-0000-0000-000000000004', 'Refinar vista Diseño de oficina', 'Conectar la experiencia visual al estado espacial persistente.', 'high', 'frontend', '10000000-0000-0000-0000-000000000005', ARRAY['10000000-0000-0000-0000-000000000002'::uuid], 'pending', 'Pendiente de ensamblaje visual', 'Esperando snapshot espacial.', 'Guiller', NULL, NULL, '{"source":"seed","initiative":"office-v1"}'::jsonb),
('30000000-0000-0000-0000-000000000005', 'Revisar aprobaciones del layout', 'Confirmar reglas de ocupación y estado visible antes de expansión futura.', 'medium', 'backend', '10000000-0000-0000-0000-000000000001', ARRAY['10000000-0000-0000-0000-000000000004'::uuid], 'awaiting_approval', 'Requiere decisión humana', 'Hay definición pendiente sobre flujos sensibles.', 'Guiller', NOW() - INTERVAL '25 minutes', NULL, '{"source":"seed","initiative":"office-v1"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_task_runs (id, task_id, agent_id, skill_ids, requested_action, execution_mode, status, duration_ms, output_summary, error_message, trace_id, raw_logs, executed_at)
VALUES
('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', ARRAY['10000000-0000-0000-0000-000000000001'::uuid], 'Auditar stack de skills', 'mock', 'completed', 1840, 'Sin conflictos mayores', NULL, 'trace-seed-001', 'Governance checklist completed.', NOW() - INTERVAL '95 minutes'),
('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', ARRAY['10000000-0000-0000-0000-000000000004'::uuid], 'Consultar estado de OpenClaw', 'cli', 'running', NULL, 'Consultando gateway local', NULL, 'trace-seed-002', 'Gateway health check started.', NOW() - INTERVAL '10 minutes'),
('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000005', ARRAY['10000000-0000-0000-0000-000000000004'::uuid, '10000000-0000-0000-0000-000000000005'::uuid], 'Construir snapshot espacial inicial', 'cli', 'running', NULL, 'Modelo y endpoints en ensamblaje', NULL, 'trace-seed-003', 'Office domain assembly in progress.', NOW() - INTERVAL '20 minutes')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_approvals (id, task_id, run_id, approval_type, reason, requested_by, status, payload_summary)
VALUES
('50000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', 'config_change', 'Cambiar configuración operativa de OpenClaw.', 'system', 'pending', '{"target":"openclaw.json"}'::jsonb),
('50000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000005', NULL, 'database_change', 'Confirmar reglas iniciales de ocupación y visibilidad del layout persistente.', 'Nora Review', 'pending', '{"scope":"office-v1"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_audit_logs (id, actor, action, module_name, payload_summary, result_status, ip_address, severity)
VALUES
('60000000-0000-0000-0000-000000000001', 'system', 'seed_initialized', 'database', '{"tables":13}'::jsonb, 'success', '127.0.0.1', 'info'),
('60000000-0000-0000-0000-000000000002', 'LokiClaw', 'openclaw_health_check', 'system', '{"mode":"cli"}'::jsonb, 'warning', '127.0.0.1', 'warning')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_mcp_servers (id, name, description, transport_type, endpoint, status, permissions, allowed_actions, last_seen_at, metadata)
VALUES
('70000000-0000-0000-0000-000000000001', 'Local MCP Placeholder', 'Servidor MCP de referencia para arquitectura futura.', 'http', 'http://127.0.0.1:3001/mcp', 'disconnected', '["read"]'::jsonb, '["list-tools"]'::jsonb, NULL, '{"mock":true}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_mcp_tools (id, server_id, name, description, permission_level, status, input_schema, metadata)
VALUES
('80000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', 'list-tools', 'Lista tools disponibles del servidor MCP.', 'read', 'available', '{"type":"object"}'::jsonb, '{"mock":true}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_system_settings (id, setting_key, setting_value, category, is_sensitive, description)
VALUES
('90000000-0000-0000-0000-000000000001', 'openclaw.mode', '"cli"'::jsonb, 'openclaw', FALSE, 'Modo preferido para operar con OpenClaw en este entorno.'),
('90000000-0000-0000-0000-000000000002', 'security.requireApprovalForDestructiveActions', 'true'::jsonb, 'security', FALSE, 'Obliga aprobaciones para acciones destructivas.'),
('90000000-0000-0000-0000-000000000003', 'ui.darkModeEnabled', 'true'::jsonb, 'ui', FALSE, 'Activa paleta preparada para modo oscuro.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_offices (id, slug, name, description, grid_columns, grid_rows, is_default, metadata)
VALUES
('a0000000-0000-0000-0000-000000000001', 'oficina-digital-principal', 'Oficina digital principal', 'Layout base persistente para coordinar agentes, estaciones y movimiento inicial de trabajo.', 16, 8, TRUE, '{"version":"v1"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_office_zones (id, office_id, code, name, subtitle, zone_type, accent, grid_x, grid_y, grid_w, grid_h, display_order, metadata)
VALUES
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'sala-estrategia', 'Sala de estrategia', 'Arquitectura, coordinación y decisiones de alcance.', 'control', 'from-fuchsia-500/60 to-violet-500/30', 0, 0, 7, 4, 1, '{}'::jsonb),
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'bahia-ejecucion', 'Bahía de ejecución', 'Implementación activa y ensamblaje fullstack.', 'delivery', 'from-sky-500/60 to-cyan-500/30', 7, 0, 5, 3, 2, '{}'::jsonb),
('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'pod-control', 'Pod de control', 'Aprobaciones, revisión y checkpoints sensibles.', 'review', 'from-amber-500/60 to-orange-500/30', 12, 0, 4, 5, 3, '{}'::jsonb),
('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'lab-integraciones', 'Laboratorio de integraciones', 'Persistencia, contratos backend y enlaces de plataforma.', 'integration', 'from-emerald-500/60 to-teal-500/30', 0, 4, 6, 4, 4, '{}'::jsonb),
('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'zona-enfoque', 'Zona de enfoque', 'Trabajo individual y aterrizaje de tareas en curso.', 'focus', 'from-rose-500/60 to-pink-500/30', 6, 3, 6, 5, 5, '{}'::jsonb),
('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'observabilidad', 'Centro de observabilidad', 'Salud operativa y seguimiento del sistema.', 'observability', 'from-indigo-500/60 to-blue-500/30', 12, 5, 4, 3, 6, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_office_stations (id, zone_id, code, name, station_type, status, capacity, metadata)
VALUES
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'mesa-orquestacion', 'Mesa de orquestación', 'table', 'occupied', 2, '{}'::jsonb),
('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'dock-runtime', 'Dock runtime', 'console', 'occupied', 1, '{}'::jsonb),
('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'cabina-review', 'Cabina de revisión', 'booth', 'occupied', 1, '{}'::jsonb),
('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'nodo-datos', 'Nodo de datos', 'desk', 'occupied', 1, '{}'::jsonb),
('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', 'desk-ui', 'Desk UI', 'desk', 'occupied', 1, '{}'::jsonb),
('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000006', 'consola-salud', 'Consola de salud', 'console', 'available', 1, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_office_agent_assignments (id, station_id, agent_id, task_id, assignment_role, presence_status, is_primary, notes, metadata)
VALUES
('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', 'orquestación de entrega', 'present', TRUE, 'Coordina la fase inicial del backend espacial.', '{}'::jsonb),
('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'ejecución de runtime', 'present', TRUE, 'Mantiene validaciones del gateway.', '{}'::jsonb),
('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000005', 'revisión de control', 'in_review', TRUE, 'Supervisa aprobaciones de layout.', '{}'::jsonb),
('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000003', 'contratos y persistencia', 'focusing', TRUE, 'Trabaja sobre SQL y endpoints.', '{}'::jsonb),
('d0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000004', 'consumo frontend', 'focusing', TRUE, 'Conecta la vista al snapshot persistente.', '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;
