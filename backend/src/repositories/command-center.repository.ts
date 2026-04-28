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
      `INSERT INTO ai_agents (name, description, agent_type, status, skill_ids, priority, execution_limit, metadata, last_activity_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW()) RETURNING *`,
      [payload.name, payload.description, payload.agentType, payload.status, payload.skillIds, payload.priority, payload.executionLimit, JSON.stringify(payload.metadata ?? {})],
    );
    return result.rows[0];
  },
  async updateAgent(agentId: string, payload: any) {
    const result = await pool.query(
      `UPDATE ai_agents
       SET name=$2, description=$3, agent_type=$4, status=$5, skill_ids=$6, priority=$7, execution_limit=$8, metadata=$9, last_activity_at=NOW()
       WHERE id=$1 RETURNING *`,
      [agentId, payload.name, payload.description, payload.agentType, payload.status, payload.skillIds, payload.priority, payload.executionLimit, JSON.stringify(payload.metadata ?? {})],
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
  async getRunById(runId: string) {
    const result = await pool.query('SELECT * FROM ai_task_runs WHERE id = $1', [runId]);
    return result.rows[0] ?? null;
  },
  async getTaskRuns(taskId: string) {
    const result = await pool.query('SELECT * FROM ai_task_runs WHERE task_id = $1 ORDER BY executed_at DESC', [taskId]);
    return result.rows;
  },
  async getApprovals() {
    const result = await pool.query('SELECT * FROM ai_approvals ORDER BY created_at DESC');
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
  async getMcpTools() {
    const result = await pool.query('SELECT * FROM ai_mcp_tools ORDER BY name ASC');
    return result.rows;
  },
  async getSystemSettings() {
    const result = await pool.query('SELECT * FROM ai_system_settings ORDER BY setting_key ASC');
    return result.rows;
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
