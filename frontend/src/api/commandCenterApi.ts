import type { Agent, Approval, AuditLog, ConsoleSnapshot, DashboardData, GlobalSearchResult, McpServer, McpTool, Mission, OfficeLayout, OfficeState, Skill, SystemSetting, Task, TaskRun } from '../types/domain';
import { apiRequest } from './client';

export const commandCenterApi = {
  getDashboard: () => apiRequest<DashboardData>('/system/dashboard'),
  globalSearch: (query: string) => apiRequest<GlobalSearchResult[]>(`/system/search?q=${encodeURIComponent(query)}`),
  getMissions: () => apiRequest<Mission[]>('/missions'),
  getMissionById: (missionId: string) => apiRequest<Mission>(`/missions/${missionId}`),
  createMission: (payload: { prompt: string; createdBy: string; priority: string; sandbox: boolean }) => apiRequest<Mission>('/missions', { method: 'POST', body: JSON.stringify(payload) }),
  updateMission: (missionId: string, payload: any) => apiRequest<Mission>(`/missions/${missionId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  startMission: (missionId: string) => apiRequest<{ mission: Mission; task: Task; requiresApproval: boolean }>(`/missions/${missionId}/start`, { method: 'POST' }),
  pauseMission: (missionId: string) => apiRequest<Mission>(`/missions/${missionId}/pause`, { method: 'POST' }),
  resumeMission: (missionId: string) => apiRequest<Mission>(`/missions/${missionId}/resume`, { method: 'POST' }),
  getHealth: () => apiRequest('/system/health'),
  getOpenClawStatus: () => apiRequest('/system/openclaw/status'),
  validateOpenClawConnection: (mode?: string) => apiRequest('/system/openclaw/validate-connection', { method: 'POST', body: JSON.stringify({ mode }) }),
  getConsoleSnapshot: () => apiRequest<ConsoleSnapshot>('/system/command-console'),

  getAgents: () => apiRequest<Agent[]>('/agents'),
  getAgent: (agentId: string) => apiRequest<Agent>(`/agents/${agentId}`),
  createAgent: (payload: unknown) => apiRequest<Agent>('/agents', { method: 'POST', body: JSON.stringify(payload) }),
  updateAgent: (agentId: string, payload: unknown) => apiRequest<Agent>(`/agents/${agentId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  updateAgentStatus: (agentId: string, status: string) => apiRequest<Agent>(`/agents/${agentId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  getSkills: () => apiRequest<Skill[]>('/skills'),
  getSkill: (skillId: string) => apiRequest<Skill>(`/skills/${skillId}`),
  createSkill: (payload: unknown) => apiRequest<Skill>('/skills', { method: 'POST', body: JSON.stringify(payload) }),
  updateSkill: (skillId: string, payload: unknown) => apiRequest<Skill>(`/skills/${skillId}`, { method: 'PUT', body: JSON.stringify(payload) }),

  getTasks: () => apiRequest<Task[]>('/tasks'),
  getTask: (taskId: string) => apiRequest<Task>(`/tasks/${taskId}`),
  createTask: (payload: unknown) => apiRequest<Task>('/tasks', { method: 'POST', body: JSON.stringify(payload) }),
  updateTask: (taskId: string, payload: unknown) => apiRequest<Task>(`/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  runTask: (taskId: string, payload: unknown) => apiRequest<TaskRun>(`/tasks/${taskId}/run`, { method: 'POST', body: JSON.stringify(payload) }),
  cancelTask: (taskId: string) => apiRequest<Task>(`/tasks/${taskId}/cancel`, { method: 'PATCH' }),
  getTaskRuns: (taskId: string) => apiRequest<TaskRun[]>(`/tasks/${taskId}/runs`),

  getTaskRunsAll: () => apiRequest<TaskRun[]>('/task-runs'),
  getRun: (runId: string) => apiRequest<TaskRun>(`/task-runs/${runId}`),
  updateRunStatus: (runId: string, payload: unknown) => apiRequest<TaskRun>(`/task-runs/${runId}/status`, { method: 'PATCH', body: JSON.stringify(payload) }),

  getApprovals: () => apiRequest<Approval[]>('/approvals'),
  createApproval: (payload: unknown) => apiRequest<Approval>('/approvals', { method: 'POST', body: JSON.stringify(payload) }),
  approveApproval: (approvalId: string, payload: unknown) => apiRequest<Approval>(`/approvals/${approvalId}/approve`, { method: 'PATCH', body: JSON.stringify(payload) }),
  rejectApproval: (approvalId: string, payload: unknown) => apiRequest<Approval>(`/approvals/${approvalId}/reject`, { method: 'PATCH', body: JSON.stringify(payload) }),
  executeApproval: (approvalId: string, payload: unknown) => apiRequest<Approval>(`/approvals/${approvalId}/execute`, { method: 'PATCH', body: JSON.stringify(payload) }),

  getAuditLogs: () => apiRequest<AuditLog[]>('/audit-logs'),

  getMcpServers: () => apiRequest<McpServer[]>('/mcp/servers'),
  createMcpServer: (payload: unknown) => apiRequest<McpServer>('/mcp/servers', { method: 'POST', body: JSON.stringify(payload) }),
  updateMcpServer: (serverId: string, payload: unknown) => apiRequest<McpServer>(`/mcp/servers/${serverId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  updateMcpServerStatus: (serverId: string, status: string) => apiRequest<McpServer>(`/mcp/servers/${serverId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getMcpTools: () => apiRequest<McpTool[]>('/mcp/tools'),

  getCurrentOfficeLayout: () => apiRequest<OfficeLayout>('/offices/current/layout'),
  getCurrentOfficeState: () => apiRequest<OfficeState>('/offices/current/state'),
  createOfficeZone: (payload: unknown) => apiRequest('/offices/current/zones', { method: 'POST', body: JSON.stringify(payload) }),
  updateOfficeZone: (zoneId: string, payload: unknown) => apiRequest(`/offices/current/zones/${zoneId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteOfficeZone: (zoneId: string) => apiRequest(`/offices/current/zones/${zoneId}`, { method: 'DELETE' }),
  createOfficeStation: (payload: unknown) => apiRequest('/offices/current/stations', { method: 'POST', body: JSON.stringify(payload) }),
  updateOfficeStation: (stationId: string, payload: unknown) => apiRequest(`/offices/current/stations/${stationId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteOfficeStation: (stationId: string) => apiRequest(`/offices/current/stations/${stationId}`, { method: 'DELETE' }),
  createOfficeAssignment: (payload: unknown) => apiRequest('/offices/current/assignments', { method: 'POST', body: JSON.stringify(payload) }),
  updateOfficeAssignment: (assignmentId: string, payload: unknown) => apiRequest(`/offices/current/assignments/${assignmentId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteOfficeAssignment: (assignmentId: string) => apiRequest(`/offices/current/assignments/${assignmentId}`, { method: 'DELETE' }),

  getSettings: () => apiRequest<SystemSetting[]>('/system/settings'),
  createSetting: (payload: unknown) => apiRequest<SystemSetting>('/system/settings', { method: 'POST', body: JSON.stringify(payload) }),
  updateSetting: (settingId: string, payload: unknown) => apiRequest<SystemSetting>(`/system/settings/${settingId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  updateSettingVisibility: (settingId: string, isSensitive: boolean) => apiRequest<SystemSetting>(`/system/settings/${settingId}/visibility`, { method: 'PATCH', body: JSON.stringify({ isSensitive }) }),
};
