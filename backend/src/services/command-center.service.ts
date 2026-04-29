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

type OfficeRecord = {
  id: string;
  slug: string;
  name: string;
  description: string;
  grid_columns: number;
  grid_rows: number;
  metadata: Record<string, unknown>;
};

type OfficeZoneRecord = {
  id: string;
  code: string;
  name: string;
  subtitle: string;
  zone_type: string;
  accent: string;
  grid_x: number;
  grid_y: number;
  grid_w: number;
  grid_h: number;
};

type OfficeStationRecord = {
  id: string;
  zone_id: string;
  code: string;
  name: string;
  station_type: string;
  status: string;
  capacity: number;
};

type OfficeAssignmentRecord = {
  id: string;
  station_id: string;
  zone_id: string;
  task_id: string | null;
  assignment_role: string;
  presence_status: string;
  is_primary: boolean;
  notes: string | null;
  station_name: string;
  agent_id: string;
  agent_name: string;
  agent_description: string;
  agent_type: string;
  agent_status: string;
  skill_ids: string[];
  priority: number;
  execution_limit: number;
  agent_metadata: Record<string, unknown>;
  last_activity_at: string | null;
  agent_created_at: string;
  task_title: string | null;
  task_description: string | null;
  task_priority: string | null;
  task_type: string | null;
  task_status: string | null;
  result_summary: string | null;
  logs: string | null;
  created_by: string | null;
  task_metadata: Record<string, unknown> | null;
  task_created_at: string | null;
  started_at: string | null;
  completed_at: string | null;
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

function requireOffice(office: OfficeRecord | null) {
  if (!office) throw new AppError('Default office not found', 404);
  return office;
}

function buildOfficeLayout(office: OfficeRecord, zoneRows: OfficeZoneRecord[], stationRows: OfficeStationRecord[]) {
  const zoneMap = new Map(
    zoneRows.map((zone) => [
      zone.id,
      {
        id: zone.id,
        code: zone.code,
        name: zone.name,
        subtitle: zone.subtitle,
        zoneType: zone.zone_type,
        accent: zone.accent,
        x: zone.grid_x,
        y: zone.grid_y,
        w: zone.grid_w,
        h: zone.grid_h,
        stations: [] as Array<{
          id: string;
          code: string;
          name: string;
          stationType: string;
          status: string;
          capacity: number;
        }>,
      },
    ]),
  );

  for (const station of stationRows) {
    const zone = zoneMap.get(station.zone_id);
    if (!zone) continue;
    zone.stations.push({
      id: station.id,
      code: station.code,
      name: station.name,
      stationType: station.station_type,
      status: station.status,
      capacity: station.capacity,
    });
  }

  return {
    office: {
      id: office.id,
      slug: office.slug,
      name: office.name,
      description: office.description,
      gridColumns: office.grid_columns,
      gridRows: office.grid_rows,
      metadata: office.metadata,
    },
    zones: Array.from(zoneMap.values()),
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
  async getCurrentOfficeLayout() {
    const office = requireOffice((await commandCenterRepository.getDefaultOffice()) as OfficeRecord | null);
    const [zones, stations] = await Promise.all([
      commandCenterRepository.getOfficeZones(office.id),
      commandCenterRepository.getOfficeStations(office.id),
    ]);

    return buildOfficeLayout(office, zones as OfficeZoneRecord[], stations as OfficeStationRecord[]);
  },
  async getCurrentOfficeState() {
    const office = requireOffice((await commandCenterRepository.getDefaultOffice()) as OfficeRecord | null);
    const [zones, stations, assignments, runs, approvals, skills, tasks] = await Promise.all([
      commandCenterRepository.getOfficeZones(office.id),
      commandCenterRepository.getOfficeStations(office.id),
      commandCenterRepository.getOfficeAssignments(office.id),
      commandCenterRepository.getRuns(),
      commandCenterRepository.getApprovals(),
      commandCenterRepository.getSkills(),
      commandCenterRepository.getTasks(),
    ]);

    const layout = buildOfficeLayout(office, zones as OfficeZoneRecord[], stations as OfficeStationRecord[]);
    const zoneMap = new Map(
      layout.zones.map((zone) => [
        zone.id,
        {
          ...zone,
          agents: [] as Array<{
            assignmentId: string;
            assignmentRole: string;
            presenceStatus: string;
            stationId: string;
            stationName: string;
            notes: string | null;
            agent: {
              id: string;
              name: string;
              description: string;
              agent_type: string;
              status: string;
              skill_ids: string[];
              priority: number;
              execution_limit: number;
              metadata: Record<string, unknown>;
              last_activity_at: string | null;
              created_at: string;
            };
            task: null | {
              id: string;
              title: string;
              description: string;
              priority: string;
              task_type: string;
              status: string;
              result_summary: string | null;
              logs: string | null;
              created_by: string | null;
              metadata: Record<string, unknown>;
              created_at: string;
              started_at: string | null;
              completed_at: string | null;
            };
          }>,
          tasks: [] as Array<{
            id: string;
            title: string;
            description: string;
            priority: string;
            task_type: string;
            status: string;
            result_summary: string | null;
            logs: string | null;
            created_by: string | null;
            metadata: Record<string, unknown>;
            created_at: string;
            started_at: string | null;
            completed_at: string | null;
          }>,
        },
      ]),
    );

    const stationAssignments = new Map<string, number>();

    for (const assignment of assignments as OfficeAssignmentRecord[]) {
      const zone = zoneMap.get(assignment.zone_id);
      if (!zone) continue;

      const task = assignment.task_id && assignment.task_title && assignment.task_description && assignment.task_priority && assignment.task_type && assignment.task_status && assignment.task_created_at
        ? {
            id: assignment.task_id,
            title: assignment.task_title,
            description: assignment.task_description,
            priority: assignment.task_priority,
            task_type: assignment.task_type,
            status: assignment.task_status,
            result_summary: assignment.result_summary,
            logs: assignment.logs,
            created_by: assignment.created_by,
            metadata: assignment.task_metadata ?? {},
            created_at: assignment.task_created_at,
            started_at: assignment.started_at,
            completed_at: assignment.completed_at,
          }
        : null;

      zone.agents.push({
        assignmentId: assignment.id,
        assignmentRole: assignment.assignment_role,
        presenceStatus: assignment.presence_status,
        stationId: assignment.station_id,
        stationName: assignment.station_name,
        notes: assignment.notes,
        agent: {
          id: assignment.agent_id,
          name: assignment.agent_name,
          description: assignment.agent_description,
          agent_type: assignment.agent_type,
          status: assignment.agent_status,
          skill_ids: assignment.skill_ids,
          priority: assignment.priority,
          execution_limit: assignment.execution_limit,
          metadata: assignment.agent_metadata,
          last_activity_at: assignment.last_activity_at,
          created_at: assignment.agent_created_at,
        },
        task,
      });

      stationAssignments.set(assignment.station_id, (stationAssignments.get(assignment.station_id) ?? 0) + 1);

      if (task && !zone.tasks.some((item) => item.id === task.id)) {
        zone.tasks.push(task);
      }
    }

    const occupiedStations = layout.zones.reduce(
      (total, zone) => total + zone.stations.filter((station) => (stationAssignments.get(station.id) ?? 0) > 0).length,
      0,
    );
    const activeRuns = (runs as Array<{ status: string }>).filter((run) => run.status === 'running');
    const pendingApprovals = (approvals as Array<{ status: string }>).filter((approval) => approval.status === 'pending');
    const recentTasks = (tasks as Array<{ id: string; status: string; created_at: string }>).filter((task) => ['running', 'pending', 'awaiting_approval'].includes(task.status)).slice(0, 6);

    return {
      office: layout.office,
      zones: Array.from(zoneMap.values()),
      metrics: {
        zones: layout.zones.length,
        stations: stations.length,
        occupiedStations,
        activeAgents: Array.from(zoneMap.values()).flatMap((zone) => zone.agents).filter((item) => item.agent.status === 'active').length,
        assignedTasks: Array.from(zoneMap.values()).flatMap((zone) => zone.tasks).length,
        activeRuns: activeRuns.length,
        pendingApprovals: pendingApprovals.length,
      },
      activeRuns,
      pendingApprovals,
      recentTasks,
      activeSkills: (skills as Array<{ status: string }>).filter((skill) => skill.status === 'active'),
    };
  },
};
