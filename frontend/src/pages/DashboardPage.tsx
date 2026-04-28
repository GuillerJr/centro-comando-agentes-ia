import { useEffect, useState } from 'react';
import { ArrowUpRight, CheckCircle2, Cpu, Siren, Sparkles, Waypoints } from 'lucide-react';
import { commandCenterApi } from '../api/commandCenterApi';
import {
  DataTable,
  ErrorState,
  InfoPanel,
  LoadingState,
  MetricCard,
  MetricPill,
  PageShell,
  SectionCard,
  StatusBadge,
} from '../components/ui';
import type { DashboardData } from '../types/domain';

function metricProgress(value: number, total: number) {
  if (total <= 0) return 12;
  return Math.max(12, Math.min(100, Math.round((value / total) * 100)));
}

export function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    commandCenterApi
      .getDashboard()
      .then(setDashboard)
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'No se pudo cargar el dashboard.'));
  }, []);

  if (error) return <ErrorState message={error} />;
  if (!dashboard) return <LoadingState label="Cargando centro de mando..." />;

  const latestAlerts = dashboard.alerts.slice(0, 4);
  const totalTracked =
    dashboard.metrics.active_agents +
    dashboard.metrics.running_tasks +
    dashboard.metrics.completed_tasks +
    dashboard.metrics.pending_approvals;

  return (
    <PageShell
      title="Command Center"
      description="Centro operativo para monitorear runtime, agentes, ejecuciones y aprobaciones con una jerarquía visual más clara y una densidad pensada para trabajo real."
      action={
        <div className="flex flex-wrap gap-3">
          <MetricPill label="Connection" value={dashboard.connectionStatus} tone={dashboard.connectionStatus === 'connected' ? 'success' : 'info'} />
          <MetricPill label="Mode" value={String(dashboard.openClawStatus.mode)} tone="default" />
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Active agents"
          value={dashboard.metrics.active_agents}
          helper="Agentes disponibles para orquestar y ejecutar trabajo."
          trend="+12%"
        />
        <MetricCard
          label="Running tasks"
          value={dashboard.metrics.running_tasks}
          helper="Carga actual del sistema en tiempo real."
          trend={`${dashboard.metrics.running_tasks || 0} live`}
        />
        <MetricCard
          label="Completed tasks"
          value={dashboard.metrics.completed_tasks}
          helper="Trabajo resuelto con trazabilidad operativa."
          trend="+8%"
        />
        <MetricCard
          label="Pending approvals"
          value={dashboard.metrics.pending_approvals}
          helper="Puntos de control esperando decisión humana."
          trend={dashboard.metrics.pending_approvals > 0 ? 'Needs review' : 'Stable'}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <SectionCard
          title="Operations overview"
          subtitle="Lectura ejecutiva de capacidad, riesgo y extensibilidad del centro de mando."
          action={
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500">
              <Sparkles className="h-4 w-4 text-sky-500" />
              Updated now
            </div>
          }
        >
          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-[linear-gradient(145deg,#eef6ff_0%,#f9fcff_55%,#ffffff_100%)] p-5">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Runtime health</p>
                  <h4 className="mt-3 text-[2rem] font-semibold tracking-tight text-slate-950">
                    {dashboard.connectionStatus === 'connected' ? 'OpenClaw synced' : 'Review connection'}
                  </h4>
                  <p className="mt-2 max-w-xl text-sm leading-7 text-slate-500">
                    Estado operacional del runtime, eventos críticos y nivel actual de cobertura para la red de agentes.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 lg:w-[18rem] lg:grid-cols-1">
                  <InfoPanel
                    eyebrow="Runtime"
                    title={dashboard.connectionStatus === 'connected' ? 'Connected' : 'Attention needed'}
                    description="Integración principal disponible para operación."
                    tone={dashboard.connectionStatus === 'connected' ? 'success' : 'warning'}
                  />
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {[
                  {
                    label: 'Agents online',
                    value: dashboard.metrics.active_agents,
                    icon: Cpu,
                    color: 'from-sky-500 to-cyan-400',
                  },
                  {
                    label: 'Critical alerts',
                    value: dashboard.metrics.critical_alerts,
                    icon: Siren,
                    color: 'from-rose-500 to-orange-400',
                  },
                  {
                    label: 'MCP connected',
                    value: dashboard.metrics.connected_mcp_servers,
                    icon: Waypoints,
                    color: 'from-emerald-500 to-teal-400',
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.label} className="rounded-[24px] border border-white/80 bg-white/80 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
                      <div className="flex items-center justify-between gap-3">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} text-white`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-semibold text-slate-400">Live</span>
                      </div>
                      <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">{item.value}</p>
                      <p className="mt-1 text-sm text-slate-500">{item.label}</p>
                      <div className="mt-4 h-2 rounded-full bg-slate-100">
                        <div
                          className={`h-2 rounded-full bg-gradient-to-r ${item.color}`}
                          style={{ width: `${metricProgress(item.value, totalTracked)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <InfoPanel
                eyebrow="Risk"
                title={`${dashboard.metrics.critical_alerts} critical alerts`}
                description="Eventos de mayor severidad que merecen revisión prioritaria."
                tone={dashboard.metrics.critical_alerts > 0 ? 'danger' : 'success'}
              />
              <InfoPanel
                eyebrow="Approvals"
                title={`${dashboard.metrics.pending_approvals} pending`}
                description="Acciones sensibles esperando confirmación explícita."
                tone={dashboard.metrics.pending_approvals > 0 ? 'warning' : 'default'}
              />
              <InfoPanel
                eyebrow="Coverage"
                title={`${dashboard.mcpServers.length} platform nodes`}
                description="Servidores MCP y piezas de plataforma observables."
                tone="default"
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Platform snapshot" subtitle="Lectura técnica rápida del runtime y la capa operativa.">
          <div className="rounded-[26px] border border-slate-200 bg-[linear-gradient(180deg,#0f172a_0%,#172033_100%)] p-5 text-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">System state</p>
                <p className="mt-1 text-lg font-semibold text-white">{String(dashboard.openClawStatus.state ?? 'Unknown')}</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <pre className="scrollbar-dark overflow-x-auto whitespace-pre-wrap rounded-[22px] bg-black/20 p-4 text-xs leading-6 text-slate-300">
              {JSON.stringify(dashboard.openClawStatus, null, 2)}
            </pre>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
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

        <SectionCard title="Recent alerts" subtitle="Riesgos, módulos impactados y severidad operativa visible.">
          <div className="space-y-3">
            {latestAlerts.length === 0 ? (
              <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-sm font-semibold text-emerald-700">No critical alerts right now.</p>
                <p className="mt-1 text-sm leading-6 text-emerald-600">La auditoría no reporta señales severas en este momento.</p>
              </div>
            ) : (
              latestAlerts.map((alert) => (
                <div key={alert.id} className="rounded-[24px] border border-slate-200 bg-slate-50/85 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{alert.action}</p>
                      <p className="mt-1 text-sm text-slate-500">{alert.module_name}</p>
                    </div>
                    <StatusBadge status={alert.severity} />
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-400">
                    <span>{alert.actor}</span>
                    <span>{alert.result_status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard title="Execution balance" subtitle="Distribución útil para lectura táctica del flujo actual.">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                label: 'Completed',
                value: dashboard.metrics.completed_tasks,
                color: 'from-emerald-500 to-teal-400',
              },
              {
                label: 'Running',
                value: dashboard.metrics.running_tasks,
                color: 'from-sky-500 to-cyan-400',
              },
              {
                label: 'Pending approvals',
                value: dashboard.metrics.pending_approvals,
                color: 'from-amber-500 to-orange-400',
              },
              {
                label: 'Critical',
                value: dashboard.metrics.critical_alerts,
                color: 'from-rose-500 to-pink-400',
              },
            ].map((item) => (
              <div key={item.label} className="rounded-[24px] border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-500">{item.label}</p>
                  <ArrowUpRight className="h-4 w-4 text-slate-300" />
                </div>
                <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{item.value}</p>
                <div className="mt-4 h-2 rounded-full bg-slate-100">
                  <div className={`h-2 rounded-full bg-gradient-to-r ${item.color}`} style={{ width: `${metricProgress(item.value, totalTracked)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Platform signals" subtitle="Indicadores compactos de preparación, settings y servidores conectados.">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50/85 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Critical alerts</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">{dashboard.metrics.critical_alerts}</p>
              <p className="mt-2 text-sm text-slate-500">Señales de alta prioridad detectadas por auditoría.</p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50/85 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Settings loaded</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">{dashboard.settings.length}</p>
              <p className="mt-2 text-sm text-slate-500">Parámetros persistidos activos en esta instancia.</p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50/85 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">MCP servers</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">{dashboard.mcpServers.length}</p>
              <p className="mt-2 text-sm text-slate-500">Nodos listos para integraciones futuras.</p>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Connected services" subtitle="Estado resumido de servidores MCP registrados en el entorno actual.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {dashboard.mcpServers.map((server) => (
            <div key={server.id} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{server.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{server.transport_type}</p>
                </div>
                <StatusBadge status={server.status} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {server.allowed_actions.slice(0, 3).map((action) => (
                  <span key={action} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                    {action}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </PageShell>
  );
}
