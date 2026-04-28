SELECT id, name, status, priority FROM ai_agents ORDER BY priority DESC;
SELECT canonical_name, skill_type, status FROM ai_skills ORDER BY canonical_name;
SELECT id, title, priority, status FROM ai_tasks ORDER BY created_at DESC;
SELECT id, task_id, status, execution_mode, trace_id FROM ai_task_runs ORDER BY executed_at DESC;
SELECT id, approval_type, status, requested_by FROM ai_approvals ORDER BY created_at DESC;
SELECT actor, action, module_name, severity, created_at FROM ai_audit_logs ORDER BY created_at DESC;
SELECT name, status, transport_type FROM ai_mcp_servers ORDER BY name;
SELECT name, permission_level, status FROM ai_mcp_tools ORDER BY name;
SELECT setting_key, category, is_sensitive FROM ai_system_settings ORDER BY setting_key;
