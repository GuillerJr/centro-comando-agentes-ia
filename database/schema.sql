CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  agent_type VARCHAR(40) NOT NULL CHECK (agent_type IN ('orchestrator', 'specialist', 'executor', 'observer', 'system')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error', 'maintenance')),
  skill_ids UUID[] NOT NULL DEFAULT '{}',
  priority INTEGER NOT NULL DEFAULT 50 CHECK (priority >= 1 AND priority <= 100),
  execution_limit INTEGER NOT NULL DEFAULT 5 CHECK (execution_limit >= 1 AND execution_limit <= 100),
  last_activity_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name VARCHAR(120) NOT NULL UNIQUE,
  conversational_alias VARCHAR(120),
  description TEXT NOT NULL,
  skill_type VARCHAR(30) NOT NULL CHECK (skill_type IN ('governance', 'architecture', 'frontend', 'backend', 'database', 'mcp', 'ui', 'fullstack', 'operations')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deprecated')),
  when_to_use TEXT NOT NULL,
  when_not_to_use TEXT NOT NULL,
  related_skills TEXT[] NOT NULL DEFAULT '{}',
  quality_checklist TEXT[] NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  task_type VARCHAR(30) NOT NULL CHECK (task_type IN ('frontend', 'backend', 'database', 'mcp', 'fullstack', 'infrastructure', 'documentation')),
  lead_skill_id UUID REFERENCES ai_skills(id) ON DELETE SET NULL,
  support_skill_ids UUID[] NOT NULL DEFAULT '{}',
  status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'running', 'awaiting_approval', 'completed', 'failed', 'cancelled')),
  result_summary TEXT,
  logs TEXT,
  created_by VARCHAR(120) NOT NULL DEFAULT 'system',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  objective TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'planned', 'queued', 'waiting_for_openclaw', 'running', 'waiting_for_approval', 'paused', 'blocked', 'failed', 'completed', 'cancelled')),
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  assigned_agent_id UUID REFERENCES ai_agents(id) ON DELETE SET NULL,
  created_by VARCHAR(120) NOT NULL DEFAULT 'system',
  summary TEXT NOT NULL,
  estimated_steps INTEGER NOT NULL DEFAULT 1 CHECK (estimated_steps >= 1),
  requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
  sensitive_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  required_integrations JSONB NOT NULL DEFAULT '[]'::jsonb,
  required_permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  plan_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_task_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES ai_tasks(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES ai_agents(id) ON DELETE SET NULL,
  skill_ids UUID[] NOT NULL DEFAULT '{}',
  requested_action TEXT NOT NULL,
  execution_mode VARCHAR(20) NOT NULL CHECK (execution_mode IN ('mock', 'cli', 'api')),
  status VARCHAR(30) NOT NULL CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  duration_ms INTEGER CHECK (duration_ms IS NULL OR duration_ms >= 0),
  output_summary TEXT,
  error_message TEXT,
  trace_id VARCHAR(120) NOT NULL,
  raw_logs TEXT,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES ai_tasks(id) ON DELETE SET NULL,
  run_id UUID REFERENCES ai_task_runs(id) ON DELETE SET NULL,
  approval_type VARCHAR(40) NOT NULL CHECK (approval_type IN ('system_command', 'sensitive_file_change', 'delete_file', 'config_change', 'database_change', 'migration', 'mcp_write')),
  reason TEXT NOT NULL,
  requested_by VARCHAR(120) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'executed')),
  reviewed_by VARCHAR(120),
  reviewed_at TIMESTAMPTZ,
  execution_notes TEXT,
  payload_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor VARCHAR(120) NOT NULL,
  action VARCHAR(160) NOT NULL,
  module_name VARCHAR(80) NOT NULL,
  payload_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  result_status VARCHAR(20) NOT NULL CHECK (result_status IN ('success', 'warning', 'error', 'critical')),
  ip_address INET,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_mcp_servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  transport_type VARCHAR(20) NOT NULL CHECK (transport_type IN ('stdio', 'http', 'websocket')),
  endpoint TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error', 'maintenance')),
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  allowed_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_seen_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_mcp_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES ai_mcp_servers(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  permission_level VARCHAR(20) NOT NULL CHECK (permission_level IN ('read', 'write', 'critical')),
  status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'disabled', 'error')),
  input_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (server_id, name)
);

CREATE TABLE IF NOT EXISTS ai_system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(120) NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  category VARCHAR(40) NOT NULL CHECK (category IN ('openclaw', 'mcp', 'security', 'ui', 'runtime')),
  is_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(160) NOT NULL UNIQUE,
  slug VARCHAR(160) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name VARCHAR(160) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_workspace_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES ai_workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES ai_users(id) ON DELETE CASCADE,
  role_key VARCHAR(40) NOT NULL CHECK (role_key IN ('owner', 'admin', 'operator', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS ai_workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(160) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  objective TEXT NOT NULL,
  default_priority VARCHAR(20) NOT NULL CHECK (default_priority IN ('low', 'medium', 'high', 'critical')),
  recommended_sandbox BOOLEAN NOT NULL DEFAULT TRUE,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_offices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(140) NOT NULL,
  description TEXT NOT NULL,
  grid_columns INTEGER NOT NULL DEFAULT 16 CHECK (grid_columns BETWEEN 1 AND 48),
  grid_rows INTEGER NOT NULL DEFAULT 8 CHECK (grid_rows BETWEEN 1 AND 48),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_office_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID NOT NULL REFERENCES ai_offices(id) ON DELETE CASCADE,
  code VARCHAR(80) NOT NULL,
  name VARCHAR(140) NOT NULL,
  subtitle TEXT NOT NULL,
  zone_type VARCHAR(40) NOT NULL CHECK (zone_type IN ('control', 'delivery', 'review', 'integration', 'focus', 'observability')),
  accent VARCHAR(120) NOT NULL,
  grid_x INTEGER NOT NULL CHECK (grid_x >= 0),
  grid_y INTEGER NOT NULL CHECK (grid_y >= 0),
  grid_w INTEGER NOT NULL CHECK (grid_w >= 1),
  grid_h INTEGER NOT NULL CHECK (grid_h >= 1),
  display_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (office_id, code)
);

CREATE TABLE IF NOT EXISTS ai_office_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES ai_office_zones(id) ON DELETE CASCADE,
  code VARCHAR(80) NOT NULL,
  name VARCHAR(140) NOT NULL,
  station_type VARCHAR(40) NOT NULL CHECK (station_type IN ('desk', 'table', 'booth', 'console', 'gateway')),
  status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'maintenance')),
  capacity INTEGER NOT NULL DEFAULT 1 CHECK (capacity >= 1 AND capacity <= 20),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (zone_id, code)
);

CREATE TABLE IF NOT EXISTS ai_office_agent_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID NOT NULL REFERENCES ai_office_stations(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  task_id UUID REFERENCES ai_tasks(id) ON DELETE SET NULL,
  assignment_role VARCHAR(80) NOT NULL,
  presence_status VARCHAR(20) NOT NULL DEFAULT 'present' CHECK (presence_status IN ('present', 'focusing', 'in_review', 'away')),
  is_primary BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (agent_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_agents_status ON ai_agents(status);
CREATE INDEX IF NOT EXISTS idx_ai_skills_type_status ON ai_skills(skill_type, status);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_status_priority ON ai_tasks(status, priority);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_type_status ON ai_tasks(task_type, status);
CREATE INDEX IF NOT EXISTS idx_ai_missions_status_priority ON ai_missions(status, priority);
CREATE INDEX IF NOT EXISTS idx_ai_missions_risk_level ON ai_missions(risk_level);
CREATE INDEX IF NOT EXISTS idx_ai_task_runs_task_id ON ai_task_runs(task_id);
CREATE INDEX IF NOT EXISTS idx_ai_task_runs_status ON ai_task_runs(status);
CREATE INDEX IF NOT EXISTS idx_ai_task_runs_trace_id ON ai_task_runs(trace_id);
CREATE INDEX IF NOT EXISTS idx_ai_approvals_status ON ai_approvals(status);
CREATE INDEX IF NOT EXISTS idx_ai_audit_logs_module_created_at ON ai_audit_logs(module_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_audit_logs_severity ON ai_audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_ai_mcp_servers_status ON ai_mcp_servers(status);
CREATE INDEX IF NOT EXISTS idx_ai_mcp_tools_server_id ON ai_mcp_tools(server_id);
CREATE INDEX IF NOT EXISTS idx_ai_system_settings_category ON ai_system_settings(category);
CREATE INDEX IF NOT EXISTS idx_ai_workflow_templates_priority ON ai_workflow_templates(default_priority);
CREATE INDEX IF NOT EXISTS idx_ai_workspaces_status ON ai_workspaces(status);
CREATE INDEX IF NOT EXISTS idx_ai_workspace_memberships_workspace ON ai_workspace_memberships(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ai_workspace_memberships_user ON ai_workspace_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_offices_default ON ai_offices(is_default);
CREATE INDEX IF NOT EXISTS idx_ai_office_zones_office_order ON ai_office_zones(office_id, display_order);
CREATE INDEX IF NOT EXISTS idx_ai_office_stations_zone_status ON ai_office_stations(zone_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_office_agent_assignments_station ON ai_office_agent_assignments(station_id);
CREATE INDEX IF NOT EXISTS idx_ai_office_agent_assignments_task ON ai_office_agent_assignments(task_id);

DROP TRIGGER IF EXISTS trg_ai_agents_updated_at ON ai_agents;
CREATE TRIGGER trg_ai_agents_updated_at BEFORE UPDATE ON ai_agents FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_ai_skills_updated_at ON ai_skills;
CREATE TRIGGER trg_ai_skills_updated_at BEFORE UPDATE ON ai_skills FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_ai_tasks_updated_at ON ai_tasks;
CREATE TRIGGER trg_ai_tasks_updated_at BEFORE UPDATE ON ai_tasks FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_ai_missions_updated_at ON ai_missions;
CREATE TRIGGER trg_ai_missions_updated_at BEFORE UPDATE ON ai_missions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_ai_task_runs_updated_at ON ai_task_runs;
CREATE TRIGGER trg_ai_task_runs_updated_at BEFORE UPDATE ON ai_task_runs FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_ai_approvals_updated_at ON ai_approvals;
CREATE TRIGGER trg_ai_approvals_updated_at BEFORE UPDATE ON ai_approvals FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_ai_audit_logs_updated_at ON ai_audit_logs;
CREATE TRIGGER trg_ai_audit_logs_updated_at BEFORE UPDATE ON ai_audit_logs FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_ai_mcp_servers_updated_at ON ai_mcp_servers;
CREATE TRIGGER trg_ai_mcp_servers_updated_at BEFORE UPDATE ON ai_mcp_servers FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_ai_mcp_tools_updated_at ON ai_mcp_tools;
CREATE TRIGGER trg_ai_mcp_tools_updated_at BEFORE UPDATE ON ai_mcp_tools FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_ai_system_settings_updated_at ON ai_system_settings;
CREATE TRIGGER trg_ai_system_settings_updated_at BEFORE UPDATE ON ai_system_settings FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_ai_workflow_templates_updated_at ON ai_workflow_templates;
CREATE TRIGGER trg_ai_workflow_templates_updated_at BEFORE UPDATE ON ai_workflow_templates FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_ai_workspaces_updated_at ON ai_workspaces;
CREATE TRIGGER trg_ai_workspaces_updated_at BEFORE UPDATE ON ai_workspaces FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_ai_users_updated_at ON ai_users;
CREATE TRIGGER trg_ai_users_updated_at BEFORE UPDATE ON ai_users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_ai_offices_updated_at ON ai_offices;
CREATE TRIGGER trg_ai_offices_updated_at BEFORE UPDATE ON ai_offices FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_ai_office_zones_updated_at ON ai_office_zones;
CREATE TRIGGER trg_ai_office_zones_updated_at BEFORE UPDATE ON ai_office_zones FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_ai_office_stations_updated_at ON ai_office_stations;
CREATE TRIGGER trg_ai_office_stations_updated_at BEFORE UPDATE ON ai_office_stations FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_ai_office_agent_assignments_updated_at ON ai_office_agent_assignments;
CREATE TRIGGER trg_ai_office_agent_assignments_updated_at BEFORE UPDATE ON ai_office_agent_assignments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
