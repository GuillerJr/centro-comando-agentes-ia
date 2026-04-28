import type { Agent, Approval, AuditLog, ConsoleSnapshot, DashboardData, McpServer, McpTool, Skill, SystemSetting, Task, TaskRun } from '../types/domain';
import { apiRequest } from './client';

export const commandCenterApi = {
  getDashboard: () => apiRequest<DashboardData>('/system/dashboard'),
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

  getApprovals: () => apiRequest<Approval[]>('/approvals'),
  createApproval: (payload: unknown) => apiRequest<Approval>('/approvals', { method: 'POST', body: JSON.stringify(payload) }),
  approveApproval: (approvalId: string, payload: unknown) => apiRequest<Approval>(`/approvals/${approvalId}/approve`, { method: 'PATCH', body: JSON.stringify(payload) }),
  rejectApproval: (approvalId: string, payload: unknown) => apiRequest<Approval>(`/approvals/${approvalId}/reject`, { method: 'PATCH', body: JSON.stringify(payload) }),

  getAuditLogs: () => apiRequest<AuditLog[]>('/audit-logs'),

  getMcpServers: () => apiRequest<McpServer[]>('/mcp/servers'),
  createMcpServer: (payload: unknown) => apiRequest<McpServer>('/mcp/servers', { method: 'POST', body: JSON.stringify(payload) }),
  getMcpTools: () => apiRequest<McpTool[]>('/mcp/tools'),

  getSettings: async () => {
    const dashboard = await apiRequest<DashboardData>('/system/dashboard');
    return dashboard.settings as SystemSetting[];
  },
};
