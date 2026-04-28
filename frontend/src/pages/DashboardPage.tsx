import { useEffect, useState } from 'react';
import { commandCenterApi } from '../api/commandCenterApi';
import { MetricCard, MetricPill, ErrorState, InfoPanel, LoadingState, DataTable, PageShell, SectionCard, StatusBadge } from '../components/ui';
import type { DashboardData } from '../types/domain';

export function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    commandCenterApi.getDashboard().then(setDashboard).catch((reason) => setError(reason instanceof Error ? reason.message : 'No se pudo cargar el dashboard.'));
  }, []);

  if (error) return <ErrorState message={error} />;
  if (!dashboard) return <LoadingState label="Cargando centro de mando..." />;

  return (
    <PageShell
      title="Command Center"
      description="Workspace central para monitorear OpenClaw, operar agentes, revisar tareas activas, aprobaciones y trazabilidad con más densidad útil y mejor jerarquía visual."
      action={
        <div className="flex flex-wrap gap-3">
          <MetricPill label="Connection" value={dashboard.connectionStatus} tone={dashboard.connectionStatus === 'connected' ? 'success' : 'info'} />
          <MetricPill label="Mode" value={String(dashboard.openClawStatus.mode)} tone="default" />
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active agents" value={dashboard.metrics.active_agents} helper="Agentes disponibles para operar y coordinar flujos." />
        <MetricCard label="Running tasks" value={dashboard.metrics.running_tasks} helper="Tareas activas con seguimiento inmediato." />
        <MetricCard label="Completed tasks" value={dashboard.metrics.completed_tasks} helper="Historial de trabajo resuelto correctamente." />
        <MetricCard label="Pending approvals" value={dashboard.metrics.pending_approvals} helper="Acciones críticas esperando confirmación." />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Operational summary" subtitle="Señales compactas de estado, riesgo y foco operativo.">
          <div className="grid gap-4 lg:grid-cols-3">
            <InfoPanel eyebrow="Runtime" title={dashboard.connectionStatus === 'connected' ? 'OpenClaw online' : 'Review required'} description={dashboard.connectionStatus === 'connected' ? 'La plataforma superior y el runtime base están enlazados y visibles.' : 'La conectividad del runtime necesita atención operativa.'} tone={dashboard.connectionStatus === 'connected' ? 'success' : 'warning'} />
            <InfoPanel eyebrow="Risk" title={`${dashboard.metrics.critical_alerts} critical alerts`} description="Eventos de mayor severidad que merecen revisión prioritaria." tone={dashboard.metrics.critical_alerts > 0 ? 'danger' : 'success'} />
            <InfoPanel eyebrow="Extensibility" title={`${dashboard.metrics.connected_mcp_servers} MCP connected`} description="Visibilidad del estado actual de extensiones y herramientas conectadas." tone="default" />
          </div>
        </SectionCard>

        <SectionCard title="OpenClaw status" subtitle="Snapshot técnico del adaptador y del runtime operativo.">
          <pre className="overflow-x-auto rounded-[22px] border border-slate-100 bg-slate-50 p-4 text-xs leading-6 text-slate-600">{JSON.stringify(dashboard.openClawStatus, null, 2)}</pre>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <SectionCard title="Latest runs" subtitle="Ejecuciones recientes con foco en trazabilidad y lectura rápida.">
          <DataTable
            columns={['Trace', 'Status', 'Mode', 'Action', 'Duration']}
            rows={dashboard.latestRuns.map((run) => [
              <span className="font-mono text-xs text-slate-400">{run.trace_id}</span>,
              <StatusBadge status={run.status} />,
              <span className="font-medium text-slate-800">{run.execution_mode}</span>,
              <span className="max-w-xs text-sm leading-6 text-slate-700">{run.requested_action}</span>,
              run.duration_ms ? `${run.duration_ms} ms` : 'In progress',
            ])}
          />
        </SectionCard>

        <SectionCard title="Platform signals" subtitle="Alertas, settings y preparación de plataforma en un formato más compacto.">
          <div className="space-y-3">
            <div className="rounded-[22px] border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Critical alerts</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{dashboard.metrics.critical_alerts}</p>
              <p className="mt-1 text-sm text-slate-500">Señales de alta prioridad detectadas por auditoría.</p>
            </div>
            <div className="rounded-[22px] border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Settings loaded</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{dashboard.settings.length}</p>
              <p className="mt-1 text-sm text-slate-500">Parámetros persistidos activos en esta instancia.</p>
            </div>
            <div className="rounded-[22px] border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">MCP servers</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{dashboard.mcpServers.length}</p>
              <p className="mt-1 text-sm text-slate-500">Nodos de extensibilidad listos para integraciones futuras.</p>
            </div>
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
