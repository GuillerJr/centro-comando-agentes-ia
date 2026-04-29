export type ApiEnvelope<T> = { success: boolean; message: string; data: T };

export type DashboardData = {
  metrics: {
    active_agents: number;
    running_tasks: number;
    completed_tasks: number;
    failed_tasks: number;
    pending_approvals: number;
    critical_alerts: number;
    connected_mcp_servers: number;
  };
  latestRuns: TaskRun[];
  alerts: AuditLog[];
  openClawStatus: { mode: string; state: string; details?: unknown };
  connectionStatus: string;
  mcpServers: McpServer[];
  settings: SystemSetting[];
};

export type Agent = { id: string; name: string; description: string; agent_type: string; status: string; skill_ids: string[]; priority: number; execution_limit: number; metadata?: Record<string, unknown>; last_activity_at?: string | null; created_at: string; };
export type Skill = { id: string; canonical_name: string; conversational_alias?: string | null; description: string; skill_type: string; status: string; when_to_use: string; when_not_to_use: string; related_skills: string[]; quality_checklist: string[]; metadata?: Record<string, unknown>; };
export type Task = { id: string; title: string; description: string; priority: string; task_type: string; lead_skill_id?: string | null; support_skill_ids: string[]; status: string; result_summary?: string | null; logs?: string | null; created_by?: string | null; metadata?: Record<string, unknown>; created_at: string; started_at?: string | null; completed_at?: string | null; };
export type TaskRun = { id: string; task_id: string; agent_id?: string | null; requested_action: string; execution_mode: string; status: string; duration_ms?: number | null; output_summary?: string | null; error_message?: string | null; trace_id: string; raw_logs?: string | null; executed_at: string; };
export type Approval = { id: string; task_id?: string | null; approval_type: string; reason: string; requested_by: string; status: string; reviewed_by?: string | null; reviewed_at?: string | null; execution_notes?: string | null; payload_summary: Record<string, unknown>; };
export type AuditLog = { id: string; actor: string; action: string; module_name: string; payload_summary: Record<string, unknown>; result_status: string; severity: string; created_at: string; };
export type McpServer = { id: string; name: string; description: string; transport_type: string; endpoint?: string | null; status: string; permissions: string[]; allowed_actions: string[]; last_seen_at?: string | null; };
export type McpTool = { id: string; server_id: string; name: string; description: string; permission_level: string; status: string; };
export type SystemSetting = { id: string; setting_key: string; setting_value: unknown; category: string; is_sensitive: boolean; description: string; };
export type ConsoleSnapshot = { availableAgents: Array<{ name: string; type: string; status: string }>; availableSkills: Array<{ canonicalName: string; type: string }>; logs: Array<{ timestamp: string; level: string; message: string }>; commandWhitelist: string[]; mode: string; };

export type Office = { id: string; slug: string; name: string; description: string; gridColumns: number; gridRows: number; metadata?: Record<string, unknown>; };
export type OfficeStation = { id: string; code: string; name: string; stationType: string; status: string; capacity: number; assignmentCount: number; availableCapacity: number; isOverCapacity: boolean; };
export type OfficeZoneTask = { id: string; title: string; description: string; priority: string; task_type: string; status: string; result_summary?: string | null; logs?: string | null; created_by?: string | null; metadata?: Record<string, unknown>; created_at: string; started_at?: string | null; completed_at?: string | null; };
export type OfficeZoneAgent = { assignmentId: string; assignmentRole: string; presenceStatus: string; stationId: string; stationName: string; notes?: string | null; agent: Agent; task?: OfficeZoneTask | null; };
export type OfficeZone = { id: string; code: string; name: string; subtitle: string; zoneType: string; accent: string; x: number; y: number; w: number; h: number; stations: OfficeStation[]; agents?: OfficeZoneAgent[]; tasks?: OfficeZoneTask[]; };
export type OfficeLayout = { office: Office; zones: OfficeZone[]; };
export type OfficeConsistencyWarning = {
  code: string;
  level: 'warning' | 'error';
  entityType: 'office' | 'zone' | 'station' | 'assignment';
  entityId: string | null;
  title: string;
  description: string;
};

export type OfficeState = {
  office: Office;
  zones: Array<OfficeZone & { agents: OfficeZoneAgent[]; tasks: OfficeZoneTask[] }>;
  metrics: {
    zones: number;
    stations: number;
    occupiedStations: number;
    activeAgents: number;
    assignedTasks: number;
    activeRuns: number;
    pendingApprovals: number;
  };
  activeRuns: TaskRun[];
  pendingApprovals: Approval[];
  recentTasks: Task[];
  activeSkills: Skill[];
  warnings: OfficeConsistencyWarning[];
};
