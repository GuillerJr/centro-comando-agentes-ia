import { useEffect, useState } from 'react';
import { CheckCircle2, Cpu, Siren, Waypoints } from 'lucide-react';
import { commandCenterApi } from '../api/commandCenterApi';
import { Button } from '../components/button';
import {
  DataTable,
  EmptyState,
  ErrorState,
  formatDisplayText,
  formatDuration,
  InfoPanel,
  LoadingState,
  MetricCard,
  MetricPill,
  PageShell,
  SectionCard,
  StatsGrid,
  StatusBadge,
} from '../components/ui';
import type { DashboardData } from '../types/domain';

function metricProgress(value: number, total: number) {
  if (total <= 0) return 12;
  return Math.max(12, Math.min(100, Math.round((value / total) * 100)));
}

export function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setDashboard(await commandCenterApi.getDashboard());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo cargar el panel general.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  if (error) return <ErrorState message={error} action={<Button onClick={() => void loadDashboard()}>Reintentar</Button>} />;
  if (isLoading) return <LoadingState label="Cargando centro de comando..." />;
  if (!dashboard) return <EmptyState title="Sin panel disponible" description="No se recibió un estado consolidado del centro de comando para este entorno." action={<Button onClick={() => void loadDashboard()}>Actualizar</Button>} />;

  const latestAlerts = dashboard.alerts.slice(0, 4);
  const totalTracked =
    dashboard.metrics.active_agents +
    dashboard.metrics.running_tasks +
    dashboard.metrics.completed_tasks +
    dashboard.metrics.pending_approvals;

  return (
    <PageShell
      title="Panel general"
      description="Vista ejecutiva del centro de comando con capacidad, riesgos, aprobaciones y salud de plataforma en una sola superficie operativa."
      action={
        <div className="flex flex-wrap gap-2">
          <MetricPill label="Conexión" value={dashboard.connectionStatus} tone={dashboard.connectionStatus === 'connected' ? 'success' : 'info'} />
          <MetricPill label="Modo" value={String(dashboard.openClawStatus.mode)} tone="default" />
        </div>
      }
    >
      <div className="metric-grid">
        <MetricCard label="Agentes activos" value={dashboard.metrics.active_agents} helper="Agentes disponibles para orquestar y ejecutar trabajo." trend="activo" />
        <MetricCard label="Tareas en curso" value={dashboard.metrics.running_tasks} helper="Carga actual del sistema en tiempo real." trend={`${dashboard.metrics.running_tasks || 0}`} />
        <MetricCard label="Tareas completadas" value={dashboard.metrics.completed_tasks} helper="Trabajo resuelto con trazabilidad operativa." trend="ok" />
        <MetricCard label="Aprobaciones pendientes" value={dashboard.metrics.pending_approvals} helper="Puntos de control esperando decisión humana." trend={dashboard.metrics.pending_approvals > 0 ? 'revisar' : 'estable'} />
      </div>

      <StatsGrid
        className="summary-grid"
        items={[
          {
            eyebrow: 'Estado general',
            title: dashboard.connectionStatus === 'connected' ? 'Operación estable' : 'Conectividad degradada',
            description: dashboard.connectionStatus === 'connected' ? 'La capa principal de ejecución está respondiendo y el tablero puede coordinar trabajo.' : 'Conviene revisar conectividad antes de disparar nuevas operaciones críticas.',
            tone: dashboard.connectionStatus === 'connected' ? 'success' : 'warning',
          },
          {
            eyebrow: 'Carga',
            title: `${dashboard.metrics.running_tasks + dashboard.metrics.pending_approvals} frentes abiertos`,
            description: 'Suma de tareas activas y decisiones humanas pendientes para leer la presión operativa actual.',
            tone: dashboard.metrics.running_tasks > 0 || dashboard.metrics.pending_approvals > 0 ? 'warning' : 'default',
          },
          {
            eyebrow: 'Extensibilidad',
            title: `${dashboard.metrics.connected_mcp_servers} servicios conectados`,
            description: 'Integraciones disponibles para expandir acciones del centro de comando sin salir del tablero.',
            tone: dashboard.metrics.connected_mcp_servers > 0 ? 'success' : 'default',
          },
        ]}
      />

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Panorama operativo" subtitle="Lectura ejecutiva de capacidad, riesgo y extensibilidad del centro de mando.">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="panel-card p-4">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Salud del runtime</p>
                  <h4 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                    {dashboard.connectionStatus === 'connected' ? 'OpenClaw sincronizado' : 'Revisar conexión'}
                  </h4>
                  <p className="mt-2 max-w-xl text-sm leading-7 text-zinc-400">
                    Estado operacional del runtime, eventos críticos y nivel actual de cobertura para la red de agentes.
                  </p>
                </div>

                <div className="w-full lg:w-[16rem]">
                  <InfoPanel
                    eyebrow="Entorno"
                    title={dashboard.connectionStatus === 'connected' ? 'Conectado' : 'Atención requerida'}
                    description="Integración principal disponible para operación."
                    tone={dashboard.connectionStatus === 'connected' ? 'success' : 'warning'}
                  />
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  {
                    label: 'Agentes en línea',
                    value: dashboard.metrics.active_agents,
                    icon: Cpu,
                    color: 'from-sky-500 to-cyan-400',
                  },
                  {
                    label: 'Alertas críticas',
                    value: dashboard.metrics.critical_alerts,
                    icon: Siren,
                    color: 'from-rose-500 to-orange-400',
                  },
                  {
                    label: 'MCP conectados',
                    value: dashboard.metrics.connected_mcp_servers,
                    icon: Waypoints,
                    color: 'from-emerald-500 to-teal-400',
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.label} className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} text-white`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">activo</span>
                      </div>
                      <p className="mt-4 text-2xl font-semibold tracking-tight text-white">{item.value}</p>
                      <p className="mt-1 text-sm text-zinc-400">{item.label}</p>
                      <div className="mt-4 h-2 rounded-full bg-white/6">
                        <div className={`h-2 rounded-full bg-gradient-to-r ${item.color}`} style={{ width: `${metricProgress(item.value, totalTracked)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <InfoPanel eyebrow="Riesgo" title={`${dashboard.metrics.critical_alerts} alertas críticas`} description="Eventos de mayor severidad que merecen revisión prioritaria." tone={dashboard.metrics.critical_alerts > 0 ? 'danger' : 'success'} />
              <InfoPanel eyebrow="Aprobaciones" title={`${dashboard.metrics.pending_approvals} pendientes`} description="Acciones sensibles esperando confirmación explícita." tone={dashboard.metrics.pending_approvals > 0 ? 'warning' : 'default'} />
              <InfoPanel eyebrow="Cobertura" title={`${dashboard.mcpServers.length} nodos de plataforma`} description="Servidores MCP y piezas de plataforma observables." tone="default" />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Estado de plataforma" subtitle="Lectura técnica rápida del runtime y la capa operativa.">
          <div className="rounded-[20px] border border-white/8 bg-black/20 p-4 text-zinc-200">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Estado del sistema</p>
                <p className="mt-1 text-lg font-semibold text-white">{formatDisplayText(String(dashboard.openClawStatus.state ?? 'Desconocido'))}</p>
              </div>
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
            </div>
            <pre className="scrollbar-dark overflow-x-auto whitespace-pre-wrap rounded-[18px] border border-white/8 bg-black/30 p-4 text-xs leading-6 text-zinc-300">
              {JSON.stringify(dashboard.openClawStatus, null, 2)}
            </pre>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <SectionCard title="Últimas ejecuciones" subtitle="Ejecuciones recientes con foco en trazabilidad y lectura rápida.">
          <DataTable
            columns={['Traza', 'Estado', 'Modo', 'Acción', 'Duración']}
            rows={dashboard.latestRuns.map((run) => [
              <span className="font-mono text-xs text-zinc-500">{run.trace_id}</span>,
              <StatusBadge status={run.status} />,
              <span className="text-sm text-zinc-300">{formatDisplayText(run.execution_mode)}</span>,
              <span className="max-w-xs text-sm leading-6 text-zinc-300">{run.requested_action}</span>,
               run.duration_ms ? formatDuration(run.duration_ms) : 'En curso',
            ])}
          />
        </SectionCard>

        <SectionCard title="Alertas recientes" subtitle="Riesgos, módulos impactados y severidad operativa visible.">
          <div className="space-y-3">
            {latestAlerts.length === 0 ? (
              <div className="rounded-[18px] border border-emerald-500/20 bg-emerald-500/10 p-4">
                <p className="text-sm font-semibold text-emerald-300">No hay alertas críticas ahora mismo.</p>
                <p className="mt-1 text-sm leading-6 text-emerald-200/80">La auditoría no reporta señales severas en este momento.</p>
              </div>
            ) : (
              latestAlerts.map((alert) => (
                <div key={alert.id} className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">{alert.action}</p>
                      <p className="mt-1 text-sm text-zinc-400">{alert.module_name}</p>
                    </div>
                    <StatusBadge status={alert.severity} />
                  </div>
                  <div className="mt-4 flex flex-col gap-1 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
                    <span>{alert.actor}</span>
                    <span>{formatDisplayText(alert.result_status)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard title="Balance de ejecución" subtitle="Distribución útil para lectura táctica del flujo actual.">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                label: 'Completadas',
                value: dashboard.metrics.completed_tasks,
                color: 'from-emerald-500 to-teal-400',
              },
              {
                label: 'En curso',
                value: dashboard.metrics.running_tasks,
                color: 'from-sky-500 to-cyan-400',
              },
              {
                label: 'Aprobaciones',
                value: dashboard.metrics.pending_approvals,
                color: 'from-amber-500 to-orange-400',
              },
              {
                label: 'Críticas',
                value: dashboard.metrics.critical_alerts,
                color: 'from-rose-500 to-pink-400',
              },
            ].map((item) => (
              <div key={item.label} className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-zinc-400">{item.label}</p>
                </div>
                <p className="mt-4 text-3xl font-semibold tracking-tight text-white">{item.value}</p>
                <div className="mt-4 h-2 rounded-full bg-white/6">
                  <div className={`h-2 rounded-full bg-gradient-to-r ${item.color}`} style={{ width: `${metricProgress(item.value, totalTracked)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Señales de plataforma" subtitle="Indicadores compactos de preparación, settings y servidores conectados.">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Alertas críticas</p>
              <p className="mt-3 text-2xl font-semibold text-white">{dashboard.metrics.critical_alerts}</p>
              <p className="mt-2 text-sm text-zinc-400">Señales de alta prioridad detectadas por auditoría.</p>
            </div>
            <div className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Configuraciones cargadas</p>
              <p className="mt-3 text-2xl font-semibold text-white">{dashboard.settings.length}</p>
              <p className="mt-2 text-sm text-zinc-400">Parámetros persistidos activos en esta instancia.</p>
            </div>
            <div className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4 sm:col-span-2 xl:col-span-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Servidores MCP</p>
              <p className="mt-3 text-2xl font-semibold text-white">{dashboard.mcpServers.length}</p>
              <p className="mt-2 text-sm text-zinc-400">Nodos listos para integraciones futuras.</p>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Servicios conectados" subtitle="Estado resumido de servidores MCP registrados en el entorno actual.">
        {dashboard.mcpServers.length === 0 ? (
          <EmptyState title="Sin servicios conectados" description="Todavía no hay servidores MCP visibles para este entorno operativo." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {dashboard.mcpServers.map((server) => (
              <div key={server.id} className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{server.name}</p>
                    <p className="mt-1 text-sm text-zinc-400">{formatDisplayText(server.transport_type)}</p>
                  </div>
                  <StatusBadge status={server.status} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {server.allowed_actions.slice(0, 3).map((action) => (
                    <span key={action} className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-xs font-medium text-zinc-400">
                      {formatDisplayText(action)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </PageShell>
  );
}
