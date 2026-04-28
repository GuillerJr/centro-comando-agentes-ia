import crypto from 'node:crypto';
import { createOpenClawAdapter } from '../adapters/openclaw-adapter.js';
import { env } from '../config/env.js';
import { commandCenterRepository } from '../repositories/command-center.repository.js';
import { AppError } from '../utils/app-error.js';

const adapter = createOpenClawAdapter();

type TaskRecord = {
  id: string;
  title: string;
  description: string;
  priority: string;
  task_type: string;
  lead_skill_id: string | null;
  support_skill_ids: string[];
  status: string;
  result_summary: string | null;
  logs: string | null;
  created_by: string;
  metadata: Record<string, unknown>;
  started_at: string | null;
};

function toTaskUpdatePayload(task: TaskRecord, overrides: Record<string, unknown>) {
  return {
    title: task.title,
    description: task.description,
    priority: task.priority,
    taskType: task.task_type,
    leadSkillId: task.lead_skill_id,
    supportSkillIds: task.support_skill_ids,
    status: task.status,
    resultSummary: task.result_summary,
    logs: task.logs,
    createdBy: task.created_by,
    metadata: task.metadata,
    startedAt: task.started_at,
    completedAt: null,
    ...overrides,
  };
}

export const commandCenterService = {
  async getDashboard() {
    const [metrics, latestRuns, auditLogs, openClawStatus, settings, mcpServers] = await Promise.all([
      commandCenterRepository.getDashboardMetrics(),
      commandCenterRepository.getRuns(),
      commandCenterRepository.getAuditLogs(),
      adapter.getStatus().catch(() => ({ mode: env.openClawMode, state: 'disconnected' })),
      commandCenterRepository.getSystemSettings(),
      commandCenterRepository.getMcpServers(),
    ]);

    return {
      metrics,
      latestRuns: latestRuns.slice(0, 5),
      alerts: auditLogs.filter((log: { severity: string }) => ['error', 'critical'].includes(log.severity)).slice(0, 5),
      openClawStatus,
      connectionStatus: openClawStatus.state ?? 'disconnected',
      mcpServers,
      settings,
    };
  },
  async getSystemHealth() {
    return {
      api: 'ok',
      timestamp: new Date().toISOString(),
      openClawMode: env.openClawMode,
    };
  },
  async getOpenClawStatus() {
    return adapter.getStatus();
  },
  async validateOpenClawConnection(mode?: 'mock' | 'api' | 'cli') {
    return createOpenClawAdapter(mode ?? env.openClawMode).validateConnection();
  },
  async listAgents() {
    return commandCenterRepository.getAgents();
  },
  async getAgentById(agentId: string) {
    const agent = await commandCenterRepository.getAgentById(agentId);
    if (!agent) throw new AppError('Agent not found', 404);
    return agent;
  },
  async createAgent(payload: any) {
    const agent = await commandCenterRepository.createAgent(payload);
    await commandCenterRepository.createAuditLog({ actor: payload.name, action: 'agent_created', moduleName: 'agents', payloadSummary: { agentId: agent.id }, resultStatus: 'success', severity: 'info' });
    return agent;
  },
  async updateAgent(agentId: string, payload: any) {
    const updated = await commandCenterRepository.updateAgent(agentId, payload);
    if (!updated) throw new AppError('Agent not found', 404);
    return updated;
  },
  async updateAgentStatus(agentId: string, status: string) {
    const updated = await commandCenterRepository.updateAgentStatus(agentId, status);
    if (!updated) throw new AppError('Agent not found', 404);
    return updated;
  },
  async listSkills() {
    return commandCenterRepository.getSkills();
  },
  async getSkillById(skillId: string) {
    const skill = await commandCenterRepository.getSkillById(skillId);
    if (!skill) throw new AppError('Skill not found', 404);
    return skill;
  },
  async createSkill(payload: any) {
    return commandCenterRepository.createSkill(payload);
  },
  async updateSkill(skillId: string, payload: any) {
    const updated = await commandCenterRepository.updateSkill(skillId, payload);
    if (!updated) throw new AppError('Skill not found', 404);
    return updated;
  },
  async listTasks() {
    return commandCenterRepository.getTasks();
  },
  async getTaskById(taskId: string) {
    const task = await commandCenterRepository.getTaskById(taskId);
    if (!task) throw new AppError('Task not found', 404);
    return task;
  },
  async createTask(payload: any) {
    const task = await commandCenterRepository.createTask(payload);
    await commandCenterRepository.createAuditLog({ actor: payload.createdBy, action: 'task_created', moduleName: 'tasks', payloadSummary: { taskId: task.id }, resultStatus: 'success', severity: 'info' });
    return task;
  },
  async updateTask(taskId: string, payload: any) {
    const updated = await commandCenterRepository.updateTask(taskId, payload);
    if (!updated) throw new AppError('Task not found', 404);
    return updated;
  },
  async runTask(taskId: string, payload: any) {
    const task = (await this.getTaskById(taskId)) as TaskRecord;
    const traceId = crypto.randomUUID();
    await commandCenterRepository.updateTask(taskId, toTaskUpdatePayload(task, {
      status: 'running',
      startedAt: new Date().toISOString(),
    }));

    const run = await commandCenterRepository.createRun({
      taskId,
      agentId: payload.agentId ?? null,
      skillIds: payload.skillIds,
      requestedAction: payload.requestedAction,
      executionMode: payload.executionMode ?? env.openClawMode,
      status: 'running',
      durationMs: null,
      outputSummary: 'Execution started',
      errorMessage: null,
      traceId,
      rawLogs: 'Execution initialized',
    });

    const start = Date.now();
    try {
      const adapterResult = await adapter.runTask({ taskId, requestedAction: payload.requestedAction });
      const durationMs = Date.now() - start;
      const updatedRun = await commandCenterRepository.updateRun(run.id, {
        status: adapterResult.status === 'completed' ? 'completed' : 'failed',
        durationMs,
        outputSummary: adapterResult.output ?? 'Execution finished',
        errorMessage: null,
        rawLogs: JSON.stringify(adapterResult),
      });
      await commandCenterRepository.updateTask(taskId, toTaskUpdatePayload(task, {
        status: adapterResult.status === 'completed' ? 'completed' : 'failed',
        resultSummary: adapterResult.output ?? 'Execution finished',
        logs: JSON.stringify(adapterResult),
        completedAt: new Date().toISOString(),
      }));
      await commandCenterRepository.createAuditLog({ actor: 'system', action: 'task_run_completed', moduleName: 'runs', payloadSummary: { taskId, runId: run.id }, resultStatus: 'success', severity: 'info' });
      return updatedRun;
    } catch (error) {
      const durationMs = Date.now() - start;
      const message = error instanceof Error ? error.message : 'Unknown adapter error';
      await commandCenterRepository.updateRun(run.id, {
        status: 'failed',
        durationMs,
        outputSummary: 'Execution failed',
        errorMessage: message,
        rawLogs: message,
      });
      await commandCenterRepository.updateTask(taskId, toTaskUpdatePayload(task, {
        status: 'failed',
        resultSummary: 'Execution failed',
        logs: message,
        completedAt: new Date().toISOString(),
      }));
      await commandCenterRepository.createAuditLog({ actor: 'system', action: 'task_run_failed', moduleName: 'runs', payloadSummary: { taskId, runId: run.id, error: message }, resultStatus: 'error', severity: 'error' });
      throw new AppError(message, 500);
    }
  },
  async cancelTask(taskId: string) {
    const updated = await commandCenterRepository.cancelTask(taskId);
    if (!updated) throw new AppError('Task not found', 404);
    return updated;
  },
  async listRuns() {
    return commandCenterRepository.getRuns();
  },
  async getRunById(runId: string) {
    const run = await commandCenterRepository.getRunById(runId);
    if (!run) throw new AppError('Run not found', 404);
    return run;
  },
  async getTaskRuns(taskId: string) {
    await this.getTaskById(taskId);
    return commandCenterRepository.getTaskRuns(taskId);
  },
  async listApprovals() {
    return commandCenterRepository.getApprovals();
  },
  async createApproval(payload: any) {
    return commandCenterRepository.createApproval(payload);
  },
  async approveApproval(approvalId: string, payload: any) {
    const approval = await commandCenterRepository.reviewApproval(approvalId, 'approved', payload);
    if (!approval) throw new AppError('Approval not found', 404);
    return approval;
  },
  async rejectApproval(approvalId: string, payload: any) {
    const approval = await commandCenterRepository.reviewApproval(approvalId, 'rejected', payload);
    if (!approval) throw new AppError('Approval not found', 404);
    return approval;
  },
  async listAuditLogs() {
    return commandCenterRepository.getAuditLogs();
  },
  async listMcpServers() {
    return commandCenterRepository.getMcpServers();
  },
  async createMcpServer(payload: any) {
    return commandCenterRepository.createMcpServer(payload);
  },
  async listMcpTools() {
    return commandCenterRepository.getMcpTools();
  },
  async getCommandConsoleSnapshot() {
    const [agents, skills, logs] = await Promise.all([
      adapter.listAgents().catch(() => []),
      adapter.listSkills().catch(() => []),
      adapter.getLogs().catch(() => []),
    ]);
    return {
      availableAgents: agents,
      availableSkills: skills,
      logs,
      commandWhitelist: env.openClawAllowedCommands,
      mode: env.openClawMode,
    };
  },
};
