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
  display_order?: number;
  metadata?: Record<string, unknown>;
};

type OfficeStationRecord = {
  id: string;
  zone_id: string;
  code: string;
  name: string;
  station_type: string;
  status: string;
  capacity: number;
  metadata?: Record<string, unknown>;
};

type OfficeConsistencyWarning = {
  code: string;
  level: 'warning' | 'error';
  entityType: 'office' | 'zone' | 'station' | 'assignment';
  entityId: string | null;
  title: string;
  description: string;
};

type MissionRecord = {
  id: string;
  title: string;
  description: string;
  objective: string;
  status: string;
  priority: string;
  risk_level: string;
  assigned_agent_id: string | null;
  created_by: string;
  summary: string;
  estimated_steps: number;
  requires_approval: boolean;
  sensitive_actions: string[];
  required_integrations: string[];
  required_permissions: string[];
  plan_json: Array<{ title: string; description: string; sensitive: boolean }>;
  metadata: Record<string, unknown>;
  started_at: string | null;
  completed_at: string | null;
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

function detectRiskLevel(prompt: string): 'low' | 'medium' | 'high' | 'critical' {
  const normalized = prompt.toLowerCase();
  if (/(dinero|producción|credencial|token|clave|borrar|eliminar|shell|instalar|script)/.test(normalized)) return 'critical';
  if (/(email|correo|calendario|reunión|comando|archivo|configuración|servicio externo)/.test(normalized)) return 'high';
  if (/(editar|actualizar|proponer|crear)/.test(normalized)) return 'medium';
  return 'low';
}

function detectSensitiveActions(prompt: string) {
  const normalized = prompt.toLowerCase();
  const candidates = [
    ['enviar correos', /(email|correo|responder)/],
    ['modificar calendario', /(calendario|reunión|agenda)/],
    ['ejecutar comandos', /(shell|comando|terminal|script)/],
    ['cambiar configuraciones', /(configuración|configurar|setting)/],
    ['acceder a archivos sensibles', /(archivo|documento|privado|secreto)/],
  ] as const;
  return candidates.filter(([, pattern]) => pattern.test(normalized)).map(([label]) => label);
}

function buildMissionPlan(prompt: string) {
  const sensitiveActions = detectSensitiveActions(prompt);
  return [
    { title: 'Analizar misión', description: 'Interpretar el objetivo, el contexto y el resultado esperado.', sensitive: false },
    { title: 'Preparar ejecución', description: 'Definir agente, recursos, integraciones y controles requeridos.', sensitive: false },
    { title: 'Ejecutar pasos operativos', description: 'Enviar la instrucción a OpenClaw mediante el conector configurado.', sensitive: sensitiveActions.length > 0 },
    { title: 'Cerrar y resumir', description: 'Consolidar resultado, trazas y siguientes pasos para el operador.', sensitive: false },
  ];
}

function resolvePolicyValue(settings: Array<{ setting_key: string; setting_value: unknown }>, key: string, fallback: boolean) {
  const matched = settings.find((setting) => setting.setting_key === key);
  if (!matched) return fallback;
  if (typeof matched.setting_value === 'boolean') return matched.setting_value;
  return fallback;
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
          assignmentCount: number;
          availableCapacity: number;
          isOverCapacity: boolean;
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
      assignmentCount: 0,
      availableCapacity: station.capacity,
      isOverCapacity: false,
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

function zoneOverlaps(a: Pick<OfficeZoneRecord, 'grid_x' | 'grid_y' | 'grid_w' | 'grid_h'>, b: Pick<OfficeZoneRecord, 'grid_x' | 'grid_y' | 'grid_w' | 'grid_h'>) {
  return a.grid_x < b.grid_x + b.grid_w
    && a.grid_x + a.grid_w > b.grid_x
    && a.grid_y < b.grid_y + b.grid_h
    && a.grid_y + a.grid_h > b.grid_y;
}

function zoneExceedsOffice(office: OfficeRecord, zone: Pick<OfficeZoneRecord, 'grid_x' | 'grid_y' | 'grid_w' | 'grid_h'>) {
  return zone.grid_x + zone.grid_w > office.grid_columns || zone.grid_y + zone.grid_h > office.grid_rows;
}

function buildOfficeWarnings(office: OfficeRecord, zones: OfficeZoneRecord[], stations: OfficeStationRecord[], assignments: OfficeAssignmentRecord[]) {
  const warnings: OfficeConsistencyWarning[] = [];
  const assignmentCountByStation = new Map<string, number>();

  for (const assignment of assignments) {
    assignmentCountByStation.set(assignment.station_id, (assignmentCountByStation.get(assignment.station_id) ?? 0) + 1);

    if (assignment.agent_status !== 'active') {
      warnings.push({
        code: 'assignment_agent_inactive',
        level: 'warning',
        entityType: 'assignment',
        entityId: assignment.id,
        title: 'Asignación con agente no activo',
        description: `${assignment.agent_name} sigue asignado aunque su estado es ${assignment.agent_status}.`,
      });
    }
  }

  for (const zone of zones) {
    if (zoneExceedsOffice(office, zone)) {
      warnings.push({
        code: 'zone_out_of_bounds',
        level: 'error',
        entityType: 'zone',
        entityId: zone.id,
        title: 'Zona fuera del plano',
        description: `${zone.name} supera la grilla ${office.grid_columns}x${office.grid_rows} de la oficina.`,
      });
    }
  }

  for (let index = 0; index < zones.length; index += 1) {
    for (let nextIndex = index + 1; nextIndex < zones.length; nextIndex += 1) {
      const current = zones[index];
      const next = zones[nextIndex];
      if (zoneOverlaps(current, next)) {
        warnings.push({
          code: 'zone_overlap',
          level: 'error',
          entityType: 'zone',
          entityId: current.id,
          title: 'Solape entre zonas',
          description: `${current.name} y ${next.name} ocupan la misma superficie del layout.`,
        });
      }
    }
  }

  for (const station of stations) {
    const assignmentCount = assignmentCountByStation.get(station.id) ?? 0;
    if (assignmentCount > station.capacity) {
      warnings.push({
        code: 'station_over_capacity',
        level: 'error',
        entityType: 'station',
        entityId: station.id,
        title: 'Estación sobreocupada',
        description: `${station.name} tiene ${assignmentCount} asignaciones para una capacidad de ${station.capacity}.`,
      });
    }
    if (assignmentCount > 0 && station.status !== 'occupied') {
      warnings.push({
        code: 'station_status_mismatch',
        level: 'warning',
        entityType: 'station',
        entityId: station.id,
        title: 'Estado de estación inconsistente',
        description: `${station.name} tiene presencia activa pero su estado visible es ${station.status}.`,
      });
    }
    if (assignmentCount === 0 && station.status === 'occupied') {
      warnings.push({
        code: 'station_marked_occupied_without_assignments',
        level: 'warning',
        entityType: 'station',
        entityId: station.id,
        title: 'Estación ocupada sin presencia',
        description: `${station.name} figura ocupada pero no tiene asignaciones activas.`,
      });
    }
    if (assignmentCount > 0 && station.status === 'maintenance') {
      warnings.push({
        code: 'station_in_maintenance_with_assignments',
        level: 'error',
        entityType: 'station',
        entityId: station.id,
        title: 'Estación en mantenimiento con asignaciones',
        description: `${station.name} no debería tener agentes asignados mientras está en mantenimiento.`,
      });
    }
  }

  return { warnings, assignmentCountByStation };
}

async function getCurrentOfficeContext() {
  const office = requireOffice((await commandCenterRepository.getDefaultOffice()) as OfficeRecord | null);
  const [zones, stations, assignments] = await Promise.all([
    commandCenterRepository.getOfficeZones(office.id),
    commandCenterRepository.getOfficeStations(office.id),
    commandCenterRepository.getOfficeAssignments(office.id),
  ]);

  return {
    office,
    zones: zones as OfficeZoneRecord[],
    stations: stations as OfficeStationRecord[],
    assignments: assignments as OfficeAssignmentRecord[],
  };
}

function ensureZoneInOffice(zones: OfficeZoneRecord[], zoneId: string) {
  const zone = zones.find((item) => item.id === zoneId) ?? null;
  if (!zone) throw new AppError('Office zone not found', 404);
  return zone;
}

function ensureStationInOffice(stations: OfficeStationRecord[], stationId: string) {
  const station = stations.find((item) => item.id === stationId) ?? null;
  if (!station) throw new AppError('Office station not found', 404);
  return station;
}

function ensureAssignmentInOffice(assignments: OfficeAssignmentRecord[], assignmentId: string) {
  const assignment = assignments.find((item) => item.id === assignmentId) ?? null;
  if (!assignment) throw new AppError('Office assignment not found', 404);
  return assignment;
}

function validateZonePayload(office: OfficeRecord, zones: OfficeZoneRecord[], payload: any, excludeZoneId?: string) {
  if (zoneExceedsOffice(office, payload)) {
    throw new AppError(`Zone must fit inside office grid ${office.grid_columns}x${office.grid_rows}`, 400);
  }

  const duplicate = zones.find((zone) => zone.id !== excludeZoneId && zone.code.toLowerCase() === payload.code.toLowerCase());
  if (duplicate) {
    throw new AppError(`Zone code already exists in office: ${duplicate.code}`, 400);
  }

  const collision = zones.find((zone) => zone.id !== excludeZoneId && zoneOverlaps(zone, payload));
  if (collision) {
    throw new AppError(`Zone overlaps with ${collision.name}`, 400);
  }
}

function validateStationPayload(stations: OfficeStationRecord[], assignments: OfficeAssignmentRecord[], payload: any, stationId?: string) {
  const currentAssignments = assignments.filter((assignment) => assignment.station_id === (stationId ?? payload.stationId)).length;
  if (payload.capacity < currentAssignments) {
    throw new AppError(`Station capacity cannot be lower than ${currentAssignments} active assignments`, 400);
  }
  if (currentAssignments > 0 && payload.status !== 'occupied') {
    throw new AppError('Stations with active assignments must remain occupied', 400);
  }
  if (currentAssignments === 0 && payload.status === 'occupied') {
    throw new AppError('Occupied stations require at least one active assignment', 400);
  }

  const duplicate = stations.find((station) => station.id !== stationId && station.zone_id === payload.zoneId && station.code.toLowerCase() === payload.code.toLowerCase());
  if (duplicate) {
    throw new AppError(`Station code already exists in this zone: ${duplicate.code}`, 400);
  }
}

async function validateAssignmentPayload(officeId: string, stations: OfficeStationRecord[], assignments: OfficeAssignmentRecord[], payload: any, assignmentId?: string) {
  const station = ensureStationInOffice(stations, payload.stationId);
  if (station.status === 'maintenance') {
    throw new AppError('Cannot assign agents to a station in maintenance', 400);
  }

  const agent = await commandCenterRepository.getAgentById(payload.agentId);
  if (!agent) throw new AppError('Agent not found', 404);
  if (agent.status !== 'active') {
    throw new AppError('Only active agents can be assigned to the office', 400);
  }

  if (payload.taskId) {
    const task = await commandCenterRepository.getTaskById(payload.taskId);
    if (!task) throw new AppError('Task not found', 404);
    if (['completed', 'cancelled', 'failed'].includes(task.status)) {
      throw new AppError('Cannot link terminal tasks to live office assignments', 400);
    }
  }

  const stationAssignments = assignments.filter((assignment) => assignment.station_id === station.id && assignment.id !== assignmentId);
  if (stationAssignments.length >= station.capacity) {
    throw new AppError(`Station ${station.name} is already at full capacity`, 400);
  }

  const duplicateAgent = assignments.find((assignment) => assignment.agent_id === payload.agentId && assignment.id !== assignmentId);
  if (duplicateAgent) {
    throw new AppError('Agent already has an active office assignment', 400);
  }

  if (payload.isPrimary) {
    const primaryCollision = stationAssignments.find((assignment) => assignment.is_primary);
    if (primaryCollision) {
      throw new AppError(`Station ${station.name} already has a primary assignment`, 400);
    }
  }

  return { station, officeId };
}

async function syncStationOccupancy(stationId: string, assignments: OfficeAssignmentRecord[], currentStationStatus?: string) {
  const count = assignments.filter((assignment) => assignment.station_id === stationId).length;
  if (count > 0) {
    await commandCenterRepository.updateOfficeStationStatus(stationId, 'occupied');
    return;
  }
  if (currentStationStatus === 'occupied') {
    await commandCenterRepository.updateOfficeStationStatus(stationId, 'available');
  }
}

export const commandCenterService = {
  // Devuelve la lista principal de misiones para la bandeja del centro de mando.
  async listMissions() {
    return commandCenterRepository.getMissions();
  },
  // Recupera una misión y falla si el identificador no existe.
  async getMissionById(missionId: string) {
    const mission = await commandCenterRepository.getMissionById(missionId);
    if (!mission) throw new AppError('Mission not found', 404);
    const tasks = await commandCenterRepository.getTasks();
    const missionTasks = tasks.filter((task) => String(task.metadata?.missionId ?? '') === missionId);
    const approvals = await commandCenterRepository.getApprovalsByTaskIds(missionTasks.map((task) => task.id));
    return { ...mission, related_tasks: missionTasks, related_approvals: approvals };
  },
  // Crea una misión inicial a partir de un prompt de alto nivel.
  async createMissionFromPrompt(payload: { prompt: string; createdBy: string; priority: string; sandbox: boolean }) {
    const riskLevel = detectRiskLevel(payload.prompt);
    const sensitiveActions = detectSensitiveActions(payload.prompt);
    const [agents, settings] = await Promise.all([
      commandCenterRepository.getAgents(),
      commandCenterRepository.getSystemSettings(),
    ]);
    const requireApprovalHighRisk = resolvePolicyValue(settings, 'politica.aprobacion_riesgo_alto', true);
    const blockShellCommands = resolvePolicyValue(settings, 'politica.bloquear_shell_sin_aprobacion', true);
    const assignedAgent = agents.find((agent) => agent.status === 'active') ?? null;
    const bloqueaPorPolitica = blockShellCommands && sensitiveActions.includes('ejecutar comandos');
    const requiresApproval = (['high', 'critical'].includes(riskLevel) && requireApprovalHighRisk) || sensitiveActions.length > 0;
    const created = await commandCenterRepository.createMission({
      title: payload.prompt.slice(0, 120),
      description: payload.prompt,
      objective: payload.prompt,
      status: bloqueaPorPolitica ? 'blocked' : 'planned',
      priority: payload.priority,
      riskLevel,
      assignedAgentId: assignedAgent?.id ?? null,
      createdBy: payload.createdBy,
      summary: bloqueaPorPolitica ? 'La misión quedó bloqueada por política de shell sin aprobación.' : payload.sandbox ? 'Misión estructurada en modo sandbox, sin ejecutar acciones reales hasta nueva decisión.' : 'Misión estructurada y pendiente de confirmación del operador.',
      estimatedSteps: 4,
      requiresApproval,
      sensitiveActions,
      requiredIntegrations: [],
      requiredPermissions: requiresApproval ? ['aprobación_humana'] : [],
      plan: buildMissionPlan(payload.prompt),
      metadata: { promptOriginal: payload.prompt, origen: 'mission_control', sandbox: payload.sandbox, decisionesPolitica: { requireApprovalHighRisk, blockShellCommands, bloqueaPorPolitica } },
    });
    await commandCenterRepository.createAuditLog({ actor: payload.createdBy, action: 'mission_created', moduleName: 'missions', payloadSummary: { missionId: created.id, riskLevel }, resultStatus: 'success', severity: 'info' });
    return created;
  },
  // Permite modificar el plan propuesto antes de enviarlo a ejecución.
  async updateMission(missionId: string, payload: any) {
    const mission = await commandCenterRepository.updateMission(missionId, payload);
    if (!mission) throw new AppError('Mission not found', 404);
    await commandCenterRepository.createAuditLog({ actor: payload.createdBy, action: 'mission_updated', moduleName: 'missions', payloadSummary: { missionId }, resultStatus: 'success', severity: 'info' });
    return mission;
  },
  // Inicia la misión, crea una tarea operativa base y genera aprobación si hay riesgo alto.
  async startMission(missionId: string) {
    const mission = await this.getMissionById(missionId) as MissionRecord;
    const updatedMission = await commandCenterRepository.updateMission(missionId, {
      title: mission.title,
      description: mission.description,
      objective: mission.objective,
      status: mission.requires_approval ? 'waiting_for_approval' : 'running',
      priority: mission.priority,
      riskLevel: mission.risk_level,
      assignedAgentId: mission.assigned_agent_id,
      createdBy: mission.created_by,
      summary: mission.summary,
      estimatedSteps: mission.estimated_steps,
      requiresApproval: mission.requires_approval,
      sensitiveActions: mission.sensitive_actions,
      requiredIntegrations: mission.required_integrations,
      requiredPermissions: mission.required_permissions,
      plan: mission.plan_json,
      metadata: mission.metadata,
      startedAt: new Date().toISOString(),
      completedAt: null,
    });
    const task = await commandCenterRepository.createTask({
      title: mission.title,
      description: mission.description,
      priority: mission.priority,
      taskType: 'fullstack',
      leadSkillId: null,
      supportSkillIds: [],
      status: mission.requires_approval ? 'awaiting_approval' : 'pending',
      resultSummary: null,
      logs: null,
      createdBy: mission.created_by,
      metadata: { missionId: mission.id, requestedAction: mission.objective, sandbox: Boolean((mission.metadata as Record<string, unknown>)?.sandbox) },
    });
    if (mission.requires_approval) {
      await commandCenterRepository.createApproval({
        taskId: task.id,
        runId: null,
        approvalType: 'config_change',
        reason: `La misión requiere revisión humana por riesgo ${mission.risk_level}.`,
        requestedBy: mission.created_by,
        payloadSummary: { missionId: mission.id, sensitiveActions: mission.sensitive_actions, objective: mission.objective },
      });
    }
    await commandCenterRepository.createAuditLog({ actor: mission.created_by, action: 'mission_started', moduleName: 'missions', payloadSummary: { missionId, taskId: task.id }, resultStatus: 'success', severity: mission.requires_approval ? 'warning' : 'info' });
    return { mission: updatedMission, task, requiresApproval: mission.requires_approval };
  },
  // Pausa una misión y marca sus tareas vivas como pendientes de reanudación.
  async pauseMission(missionId: string) {
    const mission = await this.getMissionById(missionId) as MissionRecord & { related_tasks?: TaskRecord[] };
    const updatedMission = await commandCenterRepository.updateMission(missionId, {
      title: mission.title,
      description: mission.description,
      objective: mission.objective,
      status: 'paused',
      priority: mission.priority,
      riskLevel: mission.risk_level,
      assignedAgentId: mission.assigned_agent_id,
      createdBy: mission.created_by,
      summary: mission.summary,
      estimatedSteps: mission.estimated_steps,
      requiresApproval: mission.requires_approval,
      sensitiveActions: mission.sensitive_actions,
      requiredIntegrations: mission.required_integrations,
      requiredPermissions: mission.required_permissions,
      plan: mission.plan_json,
      metadata: mission.metadata,
      startedAt: mission.started_at,
      completedAt: mission.completed_at,
    });
    for (const task of mission.related_tasks ?? []) {
      if (!['completed', 'failed', 'cancelled'].includes(task.status)) {
        await commandCenterRepository.updateTask(task.id, toTaskUpdatePayload(task as TaskRecord, { status: 'pending' }));
      }
    }
    await commandCenterRepository.createAuditLog({ actor: mission.created_by, action: 'mission_paused', moduleName: 'missions', payloadSummary: { missionId }, resultStatus: 'warning', severity: 'warning' });
    return updatedMission;
  },
  // Reanuda una misión pausada si no sigue bloqueada por política o aprobación.
  async resumeMission(missionId: string) {
    const mission = await this.getMissionById(missionId) as MissionRecord & { related_tasks?: TaskRecord[]; related_approvals?: Array<{ status: string }> };
    const pendingApproval = (mission.related_approvals ?? []).some((approval) => approval.status === 'pending');
    const blockedByPolicy = Boolean((mission.metadata as Record<string, any>)?.decisionesPolitica?.bloqueaPorPolitica);
    const nextStatus = pendingApproval ? 'waiting_for_approval' : blockedByPolicy ? 'blocked' : 'running';
    const updatedMission = await commandCenterRepository.updateMission(missionId, {
      title: mission.title,
      description: mission.description,
      objective: mission.objective,
      status: nextStatus,
      priority: mission.priority,
      riskLevel: mission.risk_level,
      assignedAgentId: mission.assigned_agent_id,
      createdBy: mission.created_by,
      summary: mission.summary,
      estimatedSteps: mission.estimated_steps,
      requiresApproval: mission.requires_approval,
      sensitiveActions: mission.sensitive_actions,
      requiredIntegrations: mission.required_integrations,
      requiredPermissions: mission.required_permissions,
      plan: mission.plan_json,
      metadata: mission.metadata,
      startedAt: mission.started_at,
      completedAt: mission.completed_at,
    });
    for (const task of mission.related_tasks ?? []) {
      if (!['completed', 'failed', 'cancelled'].includes(task.status)) {
        await commandCenterRepository.updateTask(task.id, toTaskUpdatePayload(task as TaskRecord, { status: pendingApproval ? 'awaiting_approval' : 'pending' }));
      }
    }
    await commandCenterRepository.createAuditLog({ actor: mission.created_by, action: 'mission_resumed', moduleName: 'missions', payloadSummary: { missionId, nextStatus }, resultStatus: 'success', severity: pendingApproval || blockedByPolicy ? 'warning' : 'info' });
    return updatedMission;
  },
  async globalSearch(query: string) {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    const [agents, skills, tasks, runs, approvals, settings, servers] = await Promise.all([
      commandCenterRepository.getAgents(),
      commandCenterRepository.getSkills(),
      commandCenterRepository.getTasks(),
      commandCenterRepository.getRuns(),
      commandCenterRepository.getApprovals(),
      commandCenterRepository.getSystemSettings(),
      commandCenterRepository.getMcpServers(),
    ]);

    const results = [
      ...agents.filter((item: any) => `${item.name} ${item.description} ${item.agent_type}`.toLowerCase().includes(term)).slice(0, 5).map((item: any) => ({ id: item.id, type: 'agent', title: item.name, subtitle: item.description, href: '/agents' })),
      ...skills.filter((item: any) => `${item.canonical_name} ${item.description} ${item.skill_type}`.toLowerCase().includes(term)).slice(0, 5).map((item: any) => ({ id: item.id, type: 'skill', title: item.canonical_name, subtitle: item.description, href: '/skills' })),
      ...tasks.filter((item: any) => `${item.title} ${item.description} ${item.task_type}`.toLowerCase().includes(term)).slice(0, 5).map((item: any) => ({ id: item.id, type: 'task', title: item.title, subtitle: item.description, href: `/tasks/${item.id}` })),
      ...runs.filter((item: any) => `${item.trace_id} ${item.requested_action}`.toLowerCase().includes(term)).slice(0, 5).map((item: any) => ({ id: item.id, type: 'run', title: item.trace_id, subtitle: item.requested_action, href: '/runs' })),
      ...approvals.filter((item: any) => `${item.approval_type} ${item.reason} ${item.requested_by}`.toLowerCase().includes(term)).slice(0, 5).map((item: any) => ({ id: item.id, type: 'approval', title: item.approval_type, subtitle: item.reason, href: '/approvals' })),
      ...settings.filter((item: any) => `${item.setting_key} ${item.description} ${item.category}`.toLowerCase().includes(term)).slice(0, 5).map((item: any) => ({ id: item.id, type: 'setting', title: item.setting_key, subtitle: item.description, href: '/settings' })),
      ...servers.filter((item: any) => `${item.name} ${item.description} ${item.transport_type}`.toLowerCase().includes(term)).slice(0, 5).map((item: any) => ({ id: item.id, type: 'mcp', title: item.name, subtitle: item.description, href: '/mcp' })),
    ];
    return results.slice(0, 20);
  },
  async getDashboard() {
    const [metrics, latestRuns, auditLogs, openClawStatus, settings, mcpServers, missions] = await Promise.all([
      commandCenterRepository.getDashboardMetrics(),
      commandCenterRepository.getRuns(),
      commandCenterRepository.getAuditLogs(),
      adapter.getStatus().catch(() => ({ mode: env.openClawMode, state: 'disconnected' })),
      commandCenterRepository.getSystemSettings(),
      commandCenterRepository.getMcpServers(),
      commandCenterRepository.getMissions(),
    ]);

    const missionMetrics = {
      total: missions.length,
      planned: missions.filter((mission) => mission.status === 'planned').length,
      running: missions.filter((mission) => mission.status === 'running').length,
      blocked: missions.filter((mission) => ['waiting_for_approval', 'blocked', 'paused'].includes(mission.status)).length,
      critical: missions.filter((mission) => mission.risk_level === 'critical').length,
    };

    return {
      metrics,
      missionMetrics,
      missions: missions.slice(0, 6),
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
  async updateRunStatus(runId: string, payload: any) {
    const currentRun = await commandCenterRepository.getRunById(runId);
    if (!currentRun) throw new AppError('Run not found', 404);
    const updated = await commandCenterRepository.updateRun(runId, {
      status: payload.status,
      durationMs: currentRun.duration_ms,
      outputSummary: payload.outputSummary ?? currentRun.output_summary,
      errorMessage: payload.errorMessage ?? currentRun.error_message,
      rawLogs: currentRun.raw_logs,
    });
    if (!updated) throw new AppError('Run not found', 404);
    return updated;
  },
  async getTaskRuns(taskId: string) {
    await this.getTaskById(taskId);
    return commandCenterRepository.getTaskRuns(taskId);
  },
  async listApprovals() {
    const [approvals, tasks, missions] = await Promise.all([
      commandCenterRepository.getApprovals(),
      commandCenterRepository.getTasks(),
      commandCenterRepository.getMissions(),
    ]);
    return approvals.map((approval) => {
      const task = tasks.find((item) => item.id === approval.task_id) ?? null;
      const missionId = String(task?.metadata?.missionId ?? '');
      const mission = missions.find((item) => item.id === missionId) ?? null;
      return {
        ...approval,
        mission_id: mission?.id ?? null,
        mission_title: mission?.title ?? null,
        mission_status: mission?.status ?? null,
        task_title: task?.title ?? null,
      };
    });
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
  async executeApproval(approvalId: string, payload: any) {
    const existing = await commandCenterRepository.reviewApproval(approvalId, 'approved', payload);
    if (!existing) throw new AppError('Approval not found', 404);
    return commandCenterRepository.markApprovalExecuted(approvalId);
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
  async updateMcpServer(serverId: string, payload: any) {
    const server = await commandCenterRepository.updateMcpServer(serverId, payload);
    if (!server) throw new AppError('MCP server not found', 404);
    return server;
  },
  async updateMcpServerStatus(serverId: string, status: string) {
    const server = await commandCenterRepository.updateMcpServerStatus(serverId, status);
    if (!server) throw new AppError('MCP server not found', 404);
    return server;
  },
  async listMcpTools() {
    return commandCenterRepository.getMcpTools();
  },
  async listSystemSettings() {
    return commandCenterRepository.getSystemSettings();
  },
  async createSystemSetting(payload: any) {
    return commandCenterRepository.createSystemSetting(payload);
  },
  async updateSystemSetting(settingId: string, payload: any) {
    const setting = await commandCenterRepository.updateSystemSetting(settingId, payload);
    if (!setting) throw new AppError('System setting not found', 404);
    return setting;
  },
  async updateSystemSettingVisibility(settingId: string, isSensitive: boolean) {
    const setting = await commandCenterRepository.updateSystemSettingVisibility(settingId, isSensitive);
    if (!setting) throw new AppError('System setting not found', 404);
    return setting;
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
    const { office, zones, stations } = await getCurrentOfficeContext();
    return buildOfficeLayout(office, zones, stations);
  },
  async getCurrentOfficeState() {
    const { office, zones, stations, assignments } = await getCurrentOfficeContext();
    const [runs, approvals, skills, tasks] = await Promise.all([
      commandCenterRepository.getRuns(),
      commandCenterRepository.getApprovals(),
      commandCenterRepository.getSkills(),
      commandCenterRepository.getTasks(),
    ]);

    const layout = buildOfficeLayout(office, zones, stations);
    const { warnings, assignmentCountByStation } = buildOfficeWarnings(office, zones, stations, assignments);
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

    for (const zone of layout.zones) {
      for (const station of zone.stations) {
        const assignmentCount = assignmentCountByStation.get(station.id) ?? 0;
        station.assignmentCount = assignmentCount;
        station.availableCapacity = Math.max(station.capacity - assignmentCount, 0);
        station.isOverCapacity = assignmentCount > station.capacity;
      }
    }

    for (const assignment of assignments) {
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

      if (task && !zone.tasks.some((item) => item.id === task.id)) {
        zone.tasks.push(task);
      }
    }

    const occupiedStations = layout.zones.reduce(
      (total, zone) => total + zone.stations.filter((station) => station.assignmentCount > 0).length,
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
      warnings,
    };
  },
  async createOfficeZone(payload: any) {
    const { office, zones } = await getCurrentOfficeContext();
    validateZonePayload(office, zones, payload);
    const created = await commandCenterRepository.createOfficeZone({ ...payload, officeId: office.id });
    await commandCenterRepository.createAuditLog({ actor: 'system', action: 'office_zone_created', moduleName: 'offices', payloadSummary: { zoneId: created.id, officeId: office.id }, resultStatus: 'success', severity: 'info' });
    return created;
  },
  async updateOfficeZone(zoneId: string, payload: any) {
    const { office, zones } = await getCurrentOfficeContext();
    ensureZoneInOffice(zones, zoneId);
    validateZonePayload(office, zones, payload, zoneId);
    const updated = await commandCenterRepository.updateOfficeZone(zoneId, payload);
    if (!updated) throw new AppError('Office zone not found', 404);
    await commandCenterRepository.createAuditLog({ actor: 'system', action: 'office_zone_updated', moduleName: 'offices', payloadSummary: { zoneId }, resultStatus: 'success', severity: 'info' });
    return updated;
  },
  async deleteOfficeZone(zoneId: string) {
    const { zones, stations } = await getCurrentOfficeContext();
    const zone = ensureZoneInOffice(zones, zoneId);
    if (stations.some((station) => station.zone_id === zoneId)) {
      throw new AppError('Cannot delete a zone while it still has stations', 400);
    }
    const deleted = await commandCenterRepository.deleteOfficeZone(zoneId);
    if (!deleted) throw new AppError('Office zone not found', 404);
    await commandCenterRepository.createAuditLog({ actor: 'system', action: 'office_zone_deleted', moduleName: 'offices', payloadSummary: { zoneId, zoneCode: zone.code }, resultStatus: 'success', severity: 'warning' });
    return deleted;
  },
  async createOfficeStation(payload: any) {
    const { zones, stations, assignments } = await getCurrentOfficeContext();
    ensureZoneInOffice(zones, payload.zoneId);
    validateStationPayload(stations, assignments, payload);
    const created = await commandCenterRepository.createOfficeStation(payload);
    await commandCenterRepository.createAuditLog({ actor: 'system', action: 'office_station_created', moduleName: 'offices', payloadSummary: { stationId: created.id, zoneId: payload.zoneId }, resultStatus: 'success', severity: 'info' });
    return created;
  },
  async updateOfficeStation(stationId: string, payload: any) {
    const { zones, stations, assignments } = await getCurrentOfficeContext();
    ensureZoneInOffice(zones, payload.zoneId);
    ensureStationInOffice(stations, stationId);
    validateStationPayload(stations, assignments, payload, stationId);
    const updated = await commandCenterRepository.updateOfficeStation(stationId, payload);
    if (!updated) throw new AppError('Office station not found', 404);
    await commandCenterRepository.createAuditLog({ actor: 'system', action: 'office_station_updated', moduleName: 'offices', payloadSummary: { stationId }, resultStatus: 'success', severity: 'info' });
    return updated;
  },
  async deleteOfficeStation(stationId: string) {
    const { stations, assignments } = await getCurrentOfficeContext();
    const station = ensureStationInOffice(stations, stationId);
    if (assignments.some((assignment) => assignment.station_id === stationId)) {
      throw new AppError('Cannot delete a station while it still has assignments', 400);
    }
    const deleted = await commandCenterRepository.deleteOfficeStation(stationId);
    if (!deleted) throw new AppError('Office station not found', 404);
    await commandCenterRepository.createAuditLog({ actor: 'system', action: 'office_station_deleted', moduleName: 'offices', payloadSummary: { stationId, stationCode: station.code }, resultStatus: 'success', severity: 'warning' });
    return deleted;
  },
  async createOfficeAssignment(payload: any) {
    const { office, stations, assignments } = await getCurrentOfficeContext();
    const { station } = await validateAssignmentPayload(office.id, stations, assignments, payload);
    const created = await commandCenterRepository.createOfficeAssignment(payload);
    const nextAssignments = [...assignments, { ...created, station_id: payload.stationId } as OfficeAssignmentRecord];
    await syncStationOccupancy(station.id, nextAssignments, station.status);
    await commandCenterRepository.createAuditLog({ actor: 'system', action: 'office_assignment_created', moduleName: 'offices', payloadSummary: { assignmentId: created.id, stationId: payload.stationId, agentId: payload.agentId }, resultStatus: 'success', severity: 'info' });
    return created;
  },
  async updateOfficeAssignment(assignmentId: string, payload: any) {
    const { office, stations, assignments } = await getCurrentOfficeContext();
    const current = ensureAssignmentInOffice(assignments, assignmentId);
    const previousStation = ensureStationInOffice(stations, current.station_id);
    const { station } = await validateAssignmentPayload(office.id, stations, assignments, payload, assignmentId);
    const updated = await commandCenterRepository.updateOfficeAssignment(assignmentId, payload);
    if (!updated) throw new AppError('Office assignment not found', 404);

    const nextAssignments = assignments.map((assignment) => (assignment.id === assignmentId ? { ...assignment, station_id: payload.stationId, agent_id: payload.agentId, is_primary: payload.isPrimary } : assignment));
    await syncStationOccupancy(station.id, nextAssignments as OfficeAssignmentRecord[], station.status);
    if (previousStation.id !== station.id) {
      await syncStationOccupancy(previousStation.id, nextAssignments as OfficeAssignmentRecord[], previousStation.status);
    }

    await commandCenterRepository.createAuditLog({ actor: 'system', action: 'office_assignment_updated', moduleName: 'offices', payloadSummary: { assignmentId, stationId: payload.stationId, agentId: payload.agentId }, resultStatus: 'success', severity: 'info' });
    return updated;
  },
  async deleteOfficeAssignment(assignmentId: string) {
    const { stations, assignments } = await getCurrentOfficeContext();
    const current = ensureAssignmentInOffice(assignments, assignmentId);
    const station = ensureStationInOffice(stations, current.station_id);
    const deleted = await commandCenterRepository.deleteOfficeAssignment(assignmentId);
    if (!deleted) throw new AppError('Office assignment not found', 404);
    const nextAssignments = assignments.filter((assignment) => assignment.id !== assignmentId);
    await syncStationOccupancy(station.id, nextAssignments, station.status);
    await commandCenterRepository.createAuditLog({ actor: 'system', action: 'office_assignment_deleted', moduleName: 'offices', payloadSummary: { assignmentId, stationId: station.id, agentId: current.agent_id }, resultStatus: 'success', severity: 'warning' });
    return deleted;
  },
};
