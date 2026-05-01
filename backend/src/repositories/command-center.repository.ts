import { pool } from '../db/pool.js';

export const commandCenterRepository = {
  async getAgents() {
    const result = await pool.query('SELECT * FROM ai_agents ORDER BY priority DESC, created_at DESC');
    return result.rows;
  },
  async getAgentById(agentId: string) {
    const result = await pool.query('SELECT * FROM ai_agents WHERE id = $1', [agentId]);
    return result.rows[0] ?? null;
  },
  async createAgent(payload: any) {
    const result = await pool.query(
      `INSERT INTO ai_agents (name, description, agent_type, status, skill_ids, priority, execution_limit, communication_channel, communication_channel_type, metadata, last_activity_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW()) RETURNING *`,
      [payload.name, payload.description, payload.agentType, payload.status, payload.skillIds, payload.priority, payload.executionLimit, payload.communicationChannel ?? null, payload.communicationChannelType ?? null, JSON.stringify(payload.metadata ?? {})],
    );
    return result.rows[0];
  },
  async updateAgent(agentId: string, payload: any) {
    const result = await pool.query(
      `UPDATE ai_agents
       SET name=$2, description=$3, agent_type=$4, status=$5, skill_ids=$6, priority=$7, execution_limit=$8, communication_channel=$9, communication_channel_type=$10, metadata=$11, last_activity_at=NOW()
       WHERE id=$1 RETURNING *`,
      [agentId, payload.name, payload.description, payload.agentType, payload.status, payload.skillIds, payload.priority, payload.executionLimit, payload.communicationChannel ?? null, payload.communicationChannelType ?? null, JSON.stringify(payload.metadata ?? {})],
    );
    return result.rows[0] ?? null;
  },
  async updateAgentStatus(agentId: string, status: string) {
    const result = await pool.query('UPDATE ai_agents SET status = $2, last_activity_at = NOW() WHERE id = $1 RETURNING *', [agentId, status]);
    return result.rows[0] ?? null;
  },
  async getSkills() {
    const result = await pool.query('SELECT * FROM ai_skills ORDER BY canonical_name ASC');
    return result.rows;
  },
  async getSkillById(skillId: string) {
    const result = await pool.query('SELECT * FROM ai_skills WHERE id = $1', [skillId]);
    return result.rows[0] ?? null;
  },
  async createSkill(payload: any) {
    const result = await pool.query(
      `INSERT INTO ai_skills (canonical_name, conversational_alias, description, skill_type, status, when_to_use, when_not_to_use, related_skills, quality_checklist, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [payload.canonicalName, payload.conversationalAlias, payload.description, payload.skillType, payload.status, payload.whenToUse, payload.whenNotToUse, payload.relatedSkills, payload.qualityChecklist, JSON.stringify(payload.metadata ?? {})],
    );
    return result.rows[0];
  },
  async updateSkill(skillId: string, payload: any) {
    const result = await pool.query(
      `UPDATE ai_skills
       SET canonical_name=$2, conversational_alias=$3, description=$4, skill_type=$5, status=$6, when_to_use=$7, when_not_to_use=$8, related_skills=$9, quality_checklist=$10, metadata=$11
       WHERE id=$1 RETURNING *`,
      [skillId, payload.canonicalName, payload.conversationalAlias, payload.description, payload.skillType, payload.status, payload.whenToUse, payload.whenNotToUse, payload.relatedSkills, payload.qualityChecklist, JSON.stringify(payload.metadata ?? {})],
    );
    return result.rows[0] ?? null;
  },
  async getMissions() {
    const result = await pool.query('SELECT * FROM ai_missions ORDER BY created_at DESC');
    return result.rows;
  },
  async getMissionById(missionId: string) {
    const result = await pool.query('SELECT * FROM ai_missions WHERE id = $1', [missionId]);
    return result.rows[0] ?? null;
  },
  async createMission(payload: any) {
    const result = await pool.query(
      `INSERT INTO ai_missions (title, description, objective, status, priority, risk_level, assigned_agent_id, created_by, summary, estimated_steps, requires_approval, sensitive_actions, required_integrations, required_permissions, plan_json, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [payload.title, payload.description, payload.objective, payload.status, payload.priority, payload.riskLevel, payload.assignedAgentId, payload.createdBy, payload.summary, payload.estimatedSteps, payload.requiresApproval, JSON.stringify(payload.sensitiveActions ?? []), JSON.stringify(payload.requiredIntegrations ?? []), JSON.stringify(payload.requiredPermissions ?? []), JSON.stringify(payload.plan ?? []), JSON.stringify(payload.metadata ?? {})],
    );
    return result.rows[0];
  },
  async updateMission(missionId: string, payload: any) {
    const result = await pool.query(
      `UPDATE ai_missions SET title=$2, description=$3, objective=$4, status=$5, priority=$6, risk_level=$7, assigned_agent_id=$8, created_by=$9, summary=$10, estimated_steps=$11, requires_approval=$12, sensitive_actions=$13, required_integrations=$14, required_permissions=$15, plan_json=$16, metadata=$17, started_at=$18, completed_at=$19 WHERE id=$1 RETURNING *`,
      [missionId, payload.title, payload.description, payload.objective, payload.status, payload.priority, payload.riskLevel, payload.assignedAgentId, payload.createdBy, payload.summary, payload.estimatedSteps, payload.requiresApproval, JSON.stringify(payload.sensitiveActions ?? []), JSON.stringify(payload.requiredIntegrations ?? []), JSON.stringify(payload.requiredPermissions ?? []), JSON.stringify(payload.plan ?? []), JSON.stringify(payload.metadata ?? {}), payload.startedAt ?? null, payload.completedAt ?? null],
    );
    return result.rows[0] ?? null;
  },
  async getTasks() {
    const result = await pool.query('SELECT * FROM ai_tasks ORDER BY created_at DESC');
    return result.rows;
  },
  async getTaskById(taskId: string) {
    const result = await pool.query('SELECT * FROM ai_tasks WHERE id = $1', [taskId]);
    return result.rows[0] ?? null;
  },
  async createTask(payload: any) {
    const result = await pool.query(
      `INSERT INTO ai_tasks (title, description, priority, task_type, lead_skill_id, support_skill_ids, status, result_summary, logs, created_by, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [payload.title, payload.description, payload.priority, payload.taskType, payload.leadSkillId, payload.supportSkillIds, payload.status, payload.resultSummary, payload.logs, payload.createdBy, JSON.stringify(payload.metadata ?? {})],
    );
    return result.rows[0];
  },
  async updateTask(taskId: string, payload: any) {
    const result = await pool.query(
      `UPDATE ai_tasks
       SET title=$2, description=$3, priority=$4, task_type=$5, lead_skill_id=$6, support_skill_ids=$7, status=$8, result_summary=$9, logs=$10, created_by=$11, metadata=$12,
           started_at = COALESCE($13, started_at), completed_at = COALESCE($14, completed_at)
       WHERE id=$1 RETURNING *`,
      [taskId, payload.title, payload.description, payload.priority, payload.taskType, payload.leadSkillId, payload.supportSkillIds, payload.status, payload.resultSummary, payload.logs, payload.createdBy, JSON.stringify(payload.metadata ?? {}), payload.startedAt, payload.completedAt],
    );
    return result.rows[0] ?? null;
  },
  async cancelTask(taskId: string) {
    const result = await pool.query(`UPDATE ai_tasks SET status='cancelled', cancelled_at=NOW(), completed_at=NOW() WHERE id=$1 RETURNING *`, [taskId]);
    return result.rows[0] ?? null;
  },
  async createRun(payload: any) {
    const result = await pool.query(
      `INSERT INTO ai_task_runs (task_id, agent_id, skill_ids, requested_action, execution_mode, status, duration_ms, output_summary, error_message, trace_id, raw_logs, executed_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW()) RETURNING *`,
      [payload.taskId, payload.agentId, payload.skillIds, payload.requestedAction, payload.executionMode, payload.status, payload.durationMs, payload.outputSummary, payload.errorMessage, payload.traceId, payload.rawLogs],
    );
    return result.rows[0];
  },
  async updateRun(runId: string, payload: any) {
    const result = await pool.query(
      `UPDATE ai_task_runs
       SET status=$2, duration_ms=$3, output_summary=$4, error_message=$5, raw_logs=$6
       WHERE id=$1 RETURNING *`,
      [runId, payload.status, payload.durationMs, payload.outputSummary, payload.errorMessage, payload.rawLogs],
    );
    return result.rows[0] ?? null;
  },
  async getRuns() {
    const result = await pool.query('SELECT * FROM ai_task_runs ORDER BY executed_at DESC');
    return result.rows;
  },
  async getRunsByTaskIds(taskIds: string[]) {
    if (taskIds.length === 0) return [];
    const result = await pool.query('SELECT * FROM ai_task_runs WHERE task_id = ANY($1::uuid[]) ORDER BY executed_at DESC', [taskIds]);
    return result.rows;
  },
  async getRunById(runId: string) {
    const result = await pool.query('SELECT * FROM ai_task_runs WHERE id = $1', [runId]);
    return result.rows[0] ?? null;
  },
  async getTaskRuns(taskId: string) {
    const result = await pool.query('SELECT * FROM ai_task_runs WHERE task_id = $1 ORDER BY executed_at DESC', [taskId]);
    return result.rows;
  },
  async getApprovalById(approvalId: string) {
    const result = await pool.query('SELECT * FROM ai_approvals WHERE id = $1', [approvalId]);
    return result.rows[0] ?? null;
  },
  async getApprovals() {
    const result = await pool.query('SELECT * FROM ai_approvals ORDER BY created_at DESC');
    return result.rows;
  },
  async getApprovalsByTaskIds(taskIds: string[]) {
    if (taskIds.length === 0) return [];
    const result = await pool.query('SELECT * FROM ai_approvals WHERE task_id = ANY($1::uuid[]) ORDER BY created_at DESC', [taskIds]);
    return result.rows;
  },
  async createApproval(payload: any) {
    const result = await pool.query(
      `INSERT INTO ai_approvals (task_id, run_id, approval_type, reason, requested_by, status, payload_summary)
       VALUES ($1,$2,$3,$4,$5,'pending',$6) RETURNING *`,
      [payload.taskId, payload.runId, payload.approvalType, payload.reason, payload.requestedBy, JSON.stringify(payload.payloadSummary ?? {})],
    );
    return result.rows[0];
  },
  async reviewApproval(approvalId: string, status: 'approved' | 'rejected', payload: any) {
    const result = await pool.query(
      `UPDATE ai_approvals
       SET status=$2, reviewed_by=$3, reviewed_at=NOW(), execution_notes=$4
       WHERE id=$1 RETURNING *`,
      [approvalId, status, payload.reviewedBy, payload.executionNotes],
    );
    return result.rows[0] ?? null;
  },
  async markApprovalExecuted(approvalId: string) {
    const result = await pool.query(`UPDATE ai_approvals SET status='executed', reviewed_at=NOW() WHERE id=$1 RETURNING *`, [approvalId]);
    return result.rows[0] ?? null;
  },
  async getAuditLogs() {
    const result = await pool.query('SELECT * FROM ai_audit_logs ORDER BY created_at DESC LIMIT 200');
    return result.rows;
  },
  async createAuditLog(payload: any) {
    const result = await pool.query(
      `INSERT INTO ai_audit_logs (actor, action, module_name, payload_summary, result_status, ip_address, severity)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [payload.actor, payload.action, payload.moduleName, JSON.stringify(payload.payloadSummary ?? {}), payload.resultStatus, payload.ipAddress ?? null, payload.severity],
    );
    return result.rows[0];
  },
  async getMcpServers() {
    const result = await pool.query('SELECT * FROM ai_mcp_servers ORDER BY name ASC');
    return result.rows;
  },
  async createMcpServer(payload: any) {
    const result = await pool.query(
      `INSERT INTO ai_mcp_servers (name, description, transport_type, endpoint, status, permissions, allowed_actions, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [payload.name, payload.description, payload.transportType, payload.endpoint, payload.status, JSON.stringify(payload.permissions ?? []), JSON.stringify(payload.allowedActions ?? []), JSON.stringify(payload.metadata ?? {})],
    );
    return result.rows[0];
  },
  async updateMcpServer(serverId: string, payload: any) {
    const result = await pool.query(
      `UPDATE ai_mcp_servers
       SET name=$2, description=$3, transport_type=$4, endpoint=$5, status=$6, permissions=$7, allowed_actions=$8, metadata=$9, last_seen_at=CASE WHEN $6 = 'connected' THEN NOW() ELSE last_seen_at END
       WHERE id=$1 RETURNING *`,
      [serverId, payload.name, payload.description, payload.transportType, payload.endpoint, payload.status, JSON.stringify(payload.permissions ?? []), JSON.stringify(payload.allowedActions ?? []), JSON.stringify(payload.metadata ?? {})],
    );
    return result.rows[0] ?? null;
  },
  async updateMcpServerStatus(serverId: string, status: string) {
    const result = await pool.query(
      `UPDATE ai_mcp_servers
       SET status=$2, last_seen_at=CASE WHEN $2 = 'connected' THEN NOW() ELSE last_seen_at END
       WHERE id=$1 RETURNING *`,
      [serverId, status],
    );
    return result.rows[0] ?? null;
  },
  async getMcpTools() {
    const result = await pool.query('SELECT * FROM ai_mcp_tools ORDER BY name ASC');
    return result.rows;
  },
  async getWorkspaces() {
    const result = await pool.query(
      `SELECT workspace.*, 
              COUNT(DISTINCT membership.id) AS member_count,
              COUNT(DISTINCT CASE WHEN membership.role_key = 'owner' THEN membership.id END) AS owner_count
       FROM ai_workspaces workspace
       LEFT JOIN ai_workspace_memberships membership ON membership.workspace_id = workspace.id
       GROUP BY workspace.id
       ORDER BY workspace.created_at DESC`,
    );
    return result.rows;
  },
  async getWorkspaceById(workspaceId: string) {
    const result = await pool.query('SELECT * FROM ai_workspaces WHERE id = $1', [workspaceId]);
    return result.rows[0] ?? null;
  },
  async getWorkspaceMembershipByName(workspaceId: string, displayName: string) {
    const result = await pool.query(
      `SELECT membership.*, app_user.display_name, app_user.email, app_user.status AS user_status
       FROM ai_workspace_memberships membership
       INNER JOIN ai_users app_user ON app_user.id = membership.user_id
       WHERE membership.workspace_id = $1 AND LOWER(app_user.display_name) = LOWER($2)
       LIMIT 1`,
      [workspaceId, displayName],
    );
    return result.rows[0] ?? null;
  },
  async getWorkspaceMemberships() {
    const result = await pool.query(
      `SELECT membership.id, membership.workspace_id, membership.user_id, membership.role_key, membership.created_at,
              workspace.name AS workspace_name,
              app_user.display_name,
              app_user.email,
              app_user.status AS user_status
       FROM ai_workspace_memberships membership
       INNER JOIN ai_workspaces workspace ON workspace.id = membership.workspace_id
       INNER JOIN ai_users app_user ON app_user.id = membership.user_id
       ORDER BY workspace.name ASC, membership.created_at ASC`,
    );
    return result.rows;
  },
  async updateWorkspace(workspaceId: string, payload: any) {
    const result = await pool.query(
      `UPDATE ai_workspaces SET name=$2, slug=$3, description=$4, status=$5 WHERE id=$1 RETURNING *`,
      [workspaceId, payload.name, payload.slug, payload.description, payload.status],
    );
    return result.rows[0] ?? null;
  },
  async createWorkspaceMembership(payload: any) {
    const result = await pool.query(
      `WITH target_user AS (
         INSERT INTO ai_users (display_name, email, status)
         VALUES ($1,$2,'active')
         ON CONFLICT (email) DO UPDATE SET display_name = EXCLUDED.display_name
         RETURNING *
       )
       INSERT INTO ai_workspace_memberships (workspace_id, user_id, role_key)
       SELECT $3, target_user.id, $4 FROM target_user
       ON CONFLICT (workspace_id, user_id)
       DO UPDATE SET role_key = EXCLUDED.role_key
       RETURNING *`,
      [payload.displayName, payload.email, payload.workspaceId, payload.roleKey],
    );
    return result.rows[0] ?? null;
  },
  async createWorkspace(payload: any) {
    const result = await pool.query(
      `WITH created_workspace AS (
         INSERT INTO ai_workspaces (name, slug, description, status)
         VALUES ($1,$2,$3,'active') RETURNING *
       ), created_user AS (
         INSERT INTO ai_users (display_name, email, status)
         VALUES ($4,$5,'active')
         ON CONFLICT (email) DO UPDATE SET display_name = EXCLUDED.display_name
         RETURNING *
       ), created_membership AS (
         INSERT INTO ai_workspace_memberships (workspace_id, user_id, role_key)
         SELECT created_workspace.id, created_user.id, 'owner' FROM created_workspace, created_user
         ON CONFLICT (workspace_id, user_id) DO NOTHING
       )
       SELECT * FROM created_workspace`,
      [payload.name, payload.slug, payload.description, payload.ownerName, payload.ownerEmail],
    );
    return result.rows[0];
  },
  async getWorkflowTemplates() {
    const result = await pool.query('SELECT * FROM ai_workflow_templates ORDER BY created_at DESC');
    return result.rows;
  },
  async createWorkflowTemplate(payload: any) {
    const result = await pool.query(
      `INSERT INTO ai_workflow_templates (name, description, objective, default_priority, recommended_sandbox, steps, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [payload.name, payload.description, payload.objective, payload.defaultPriority, payload.recommendedSandbox, JSON.stringify(payload.steps ?? []), JSON.stringify(payload.metadata ?? {})],
    );
    return result.rows[0];
  },
  async getWorkflowTemplateById(workflowId: string) {
    const result = await pool.query('SELECT * FROM ai_workflow_templates WHERE id = $1', [workflowId]);
    return result.rows[0] ?? null;
  },
  async getSystemSettings() {
    const result = await pool.query('SELECT * FROM ai_system_settings ORDER BY setting_key ASC');
    return result.rows;
  },
  async getSystemSettingById(settingId: string) {
    const result = await pool.query('SELECT * FROM ai_system_settings WHERE id = $1', [settingId]);
    return result.rows[0] ?? null;
  },
  async createSystemSetting(payload: any) {
    const result = await pool.query(
      `INSERT INTO ai_system_settings (setting_key, setting_value, category, is_sensitive, description)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [payload.settingKey, JSON.stringify(payload.settingValue), payload.category, payload.isSensitive, payload.description],
    );
    return result.rows[0];
  },
  async updateSystemSetting(settingId: string, payload: any) {
    const result = await pool.query(
      `UPDATE ai_system_settings
       SET setting_key=$2, setting_value=$3, category=$4, is_sensitive=$5, description=$6
       WHERE id=$1 RETURNING *`,
      [settingId, payload.settingKey, JSON.stringify(payload.settingValue), payload.category, payload.isSensitive, payload.description],
    );
    return result.rows[0] ?? null;
  },
  async updateSystemSettingVisibility(settingId: string, isSensitive: boolean) {
    const result = await pool.query('UPDATE ai_system_settings SET is_sensitive = $2 WHERE id = $1 RETURNING *', [settingId, isSensitive]);
    return result.rows[0] ?? null;
  },
  async getDefaultOffice() {
    const result = await pool.query('SELECT * FROM ai_offices WHERE is_default = TRUE ORDER BY created_at ASC LIMIT 1');
    return result.rows[0] ?? null;
  },
  async getOfficeZones(officeId: string) {
    const result = await pool.query('SELECT * FROM ai_office_zones WHERE office_id = $1 ORDER BY display_order ASC, created_at ASC', [officeId]);
    return result.rows;
  },
  async getOfficeZoneById(zoneId: string) {
    const result = await pool.query('SELECT * FROM ai_office_zones WHERE id = $1', [zoneId]);
    return result.rows[0] ?? null;
  },
  async createOfficeZone(payload: any) {
    const result = await pool.query(
      `INSERT INTO ai_office_zones (office_id, code, name, subtitle, zone_type, accent, grid_x, grid_y, grid_w, grid_h, display_order, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [payload.officeId, payload.code, payload.name, payload.subtitle, payload.zoneType, payload.accent, payload.gridX, payload.gridY, payload.gridW, payload.gridH, payload.displayOrder, JSON.stringify(payload.metadata ?? {})],
    );
    return result.rows[0];
  },
  async updateOfficeZone(zoneId: string, payload: any) {
    const result = await pool.query(
      `UPDATE ai_office_zones
       SET code=$2, name=$3, subtitle=$4, zone_type=$5, accent=$6, grid_x=$7, grid_y=$8, grid_w=$9, grid_h=$10, display_order=$11, metadata=$12
       WHERE id=$1 RETURNING *`,
      [zoneId, payload.code, payload.name, payload.subtitle, payload.zoneType, payload.accent, payload.gridX, payload.gridY, payload.gridW, payload.gridH, payload.displayOrder, JSON.stringify(payload.metadata ?? {})],
    );
    return result.rows[0] ?? null;
  },
  async deleteOfficeZone(zoneId: string) {
    const result = await pool.query('DELETE FROM ai_office_zones WHERE id = $1 RETURNING *', [zoneId]);
    return result.rows[0] ?? null;
  },
  async getOfficeStations(officeId: string) {
    const result = await pool.query(
      `SELECT stations.*
       FROM ai_office_stations stations
       INNER JOIN ai_office_zones zones ON zones.id = stations.zone_id
       WHERE zones.office_id = $1
       ORDER BY zones.display_order ASC, stations.name ASC`,
      [officeId],
    );
    return result.rows;
  },
  async getOfficeStationById(stationId: string) {
    const result = await pool.query('SELECT * FROM ai_office_stations WHERE id = $1', [stationId]);
    return result.rows[0] ?? null;
  },
  async createOfficeStation(payload: any) {
    const result = await pool.query(
      `INSERT INTO ai_office_stations (zone_id, code, name, station_type, status, capacity, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [payload.zoneId, payload.code, payload.name, payload.stationType, payload.status, payload.capacity, JSON.stringify(payload.metadata ?? {})],
    );
    return result.rows[0];
  },
  async updateOfficeStation(stationId: string, payload: any) {
    const result = await pool.query(
      `UPDATE ai_office_stations
       SET zone_id=$2, code=$3, name=$4, station_type=$5, status=$6, capacity=$7, metadata=$8
       WHERE id=$1 RETURNING *`,
      [stationId, payload.zoneId, payload.code, payload.name, payload.stationType, payload.status, payload.capacity, JSON.stringify(payload.metadata ?? {})],
    );
    return result.rows[0] ?? null;
  },
  async updateOfficeStationStatus(stationId: string, status: string) {
    const result = await pool.query('UPDATE ai_office_stations SET status = $2 WHERE id = $1 RETURNING *', [stationId, status]);
    return result.rows[0] ?? null;
  },
  async deleteOfficeStation(stationId: string) {
    const result = await pool.query('DELETE FROM ai_office_stations WHERE id = $1 RETURNING *', [stationId]);
    return result.rows[0] ?? null;
  },
  async getOfficeAssignments(officeId: string) {
    const result = await pool.query(
      `SELECT
         assignment.id,
         assignment.station_id,
         assignment.agent_id,
         assignment.task_id,
         assignment.assignment_role,
         assignment.presence_status,
         assignment.is_primary,
         assignment.notes,
         assignment.metadata,
         station.zone_id,
         station.name AS station_name,
         agent.name AS agent_name,
         agent.description AS agent_description,
         agent.agent_type,
         agent.status AS agent_status,
         agent.skill_ids,
         agent.priority,
         agent.execution_limit,
         agent.metadata AS agent_metadata,
         agent.last_activity_at,
         agent.created_at AS agent_created_at,
         task.title AS task_title,
         task.description AS task_description,
         task.priority AS task_priority,
         task.task_type,
         task.status AS task_status,
         task.result_summary,
         task.logs,
         task.created_by,
         task.metadata AS task_metadata,
         task.created_at AS task_created_at,
         task.started_at,
         task.completed_at
       FROM ai_office_agent_assignments assignment
       INNER JOIN ai_office_stations station ON station.id = assignment.station_id
       INNER JOIN ai_office_zones zone ON zone.id = station.zone_id
       INNER JOIN ai_agents agent ON agent.id = assignment.agent_id
       LEFT JOIN ai_tasks task ON task.id = assignment.task_id
       WHERE zone.office_id = $1
       ORDER BY zone.display_order ASC, station.name ASC, agent.priority DESC, agent.name ASC`,
      [officeId],
    );
    return result.rows;
  },
  async getOfficeAssignmentById(assignmentId: string) {
    const result = await pool.query('SELECT * FROM ai_office_agent_assignments WHERE id = $1', [assignmentId]);
    return result.rows[0] ?? null;
  },
  async createOfficeAssignment(payload: any) {
    const result = await pool.query(
      `INSERT INTO ai_office_agent_assignments (station_id, agent_id, task_id, assignment_role, presence_status, is_primary, notes, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [payload.stationId, payload.agentId, payload.taskId, payload.assignmentRole, payload.presenceStatus, payload.isPrimary, payload.notes ?? null, JSON.stringify(payload.metadata ?? {})],
    );
    return result.rows[0];
  },
  async updateOfficeAssignment(assignmentId: string, payload: any) {
    const result = await pool.query(
      `UPDATE ai_office_agent_assignments
       SET station_id=$2, agent_id=$3, task_id=$4, assignment_role=$5, presence_status=$6, is_primary=$7, notes=$8, metadata=$9
       WHERE id=$1 RETURNING *`,
      [assignmentId, payload.stationId, payload.agentId, payload.taskId, payload.assignmentRole, payload.presenceStatus, payload.isPrimary, payload.notes ?? null, JSON.stringify(payload.metadata ?? {})],
    );
    return result.rows[0] ?? null;
  },
  async deleteOfficeAssignment(assignmentId: string) {
    const result = await pool.query('DELETE FROM ai_office_agent_assignments WHERE id = $1 RETURNING *', [assignmentId]);
    return result.rows[0] ?? null;
  },
  async getDashboardMetrics() {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM ai_agents WHERE status = 'active')::int AS active_agents,
        (SELECT COUNT(*) FROM ai_tasks WHERE status = 'running')::int AS running_tasks,
        (SELECT COUNT(*) FROM ai_tasks WHERE status = 'completed')::int AS completed_tasks,
        (SELECT COUNT(*) FROM ai_tasks WHERE status = 'failed')::int AS failed_tasks,
        (SELECT COUNT(*) FROM ai_approvals WHERE status = 'pending')::int AS pending_approvals,
        (SELECT COUNT(*) FROM ai_audit_logs WHERE severity IN ('error','critical'))::int AS critical_alerts,
        (SELECT COUNT(*) FROM ai_mcp_servers WHERE status = 'connected')::int AS connected_mcp_servers
    `);
    return result.rows[0];
  },
};
