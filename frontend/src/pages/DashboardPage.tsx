import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { commandCenterApi } from '../api/commandCenterApi';
import { Button } from '../components/button';
import { DataTable, EmptyState, ErrorState, formatDisplayText, formatDuration, LoadingState, MetricCard, MetricPill, PageShell, SectionCard, StatsGrid, StatusBadge } from '../components/ui';
import type { DashboardData } from '../types/domain';

export function DashboardPage() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carga la vista principal del centro de mando con foco en misiones y gobernanza.
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
  if (isLoading) return <LoadingState label="Cargando Mission Control..." />;
  if (!dashboard) return <EmptyState title="Sin panel disponible" description="No se recibió un estado consolidado del centro de mando para este entorno." action={<Button onClick={() => void loadDashboard()}>Actualizar</Button>} />;

  return (
    <PageShell
      title="Mission Control"
      description="Centro operativo para planificar misiones, revisar bloqueos, gobernar acciones sensibles y supervisar la ejecución conectada con OpenClaw."
      action={
        <div className="flex flex-wrap gap-2">
          <MetricPill label="Conexión" value={dashboard.connectionStatus} tone={dashboard.connectionStatus === 'connected' ? 'success' : 'warning'} />
          <MetricPill label="Modo" value={String(dashboard.openClawStatus.mode)} tone="default" />
        </div>
      }
    >
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Button variant="secondary" onClick={() => navigate('/missions')}>Ir a misiones</Button>
        <Button variant="secondary" onClick={() => navigate('/approvals')}>Revisar aprobaciones</Button>
        <Button variant="secondary" onClick={() => navigate('/runs')}>Ver ejecuciones</Button>
        <Button variant="secondary" onClick={() => navigate('/office-design')}>Abrir oficina</Button>
      </div>

      <div className="metric-grid">
        <MetricCard label="Misiones registradas" value={dashboard.missionMetrics.total} helper="Volumen total de misiones visibles en el centro de mando." trend="mando" />
        <MetricCard label="Misiones planificadas" value={dashboard.missionMetrics.planned} helper="Trabajo listo para revisión humana antes de iniciar ejecución." trend="listas" />
        <MetricCard label="Misiones activas" value={dashboard.missionMetrics.running} helper="Misiones que ya están empujando trabajo al plano operativo." trend="en curso" />
        <MetricCard label="Misiones bloqueadas" value={dashboard.missionMetrics.blocked} helper="Misiones detenidas por aprobación, pausa o bloqueo operativo." trend={dashboard.missionMetrics.blocked > 0 ? 'revisar' : 'estable'} />
      </div>

      <StatsGrid
        className="grid gap-5 md:grid-cols-2 xl:grid-cols-4"
        items={[
          { eyebrow: 'Riesgo', title: `${dashboard.missionMetrics.critical} críticas`, description: 'Misiones que exigen supervisión, aprobación o máxima cautela.', tone: dashboard.missionMetrics.critical > 0 ? 'danger' : 'success' },
          { eyebrow: 'Aprobaciones', title: `${dashboard.metrics.pending_approvals} pendientes`, description: 'Controles humanos esperando decisión para permitir avanzar trabajo sensible.', tone: dashboard.metrics.pending_approvals > 0 ? 'warning' : 'default' },
          { eyebrow: 'Agentes', title: `${dashboard.metrics.active_agents} activos`, description: 'Capacidad disponible en la red de agentes para seguir absorbiendo trabajo.', tone: 'success' },
          { eyebrow: 'Integraciones', title: `${dashboard.metrics.connected_mcp_servers} conectadas`, description: 'Servicios y herramientas disponibles para ampliar la ejecución.', tone: 'default' },
        ]}
      />

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="Cola principal de misiones" subtitle="Lectura prioritaria del trabajo estratégico que gobierna Mission Control.">
          <DataTable
            columns={['Misión', 'Estado', 'Riesgo', 'Aprobación', 'Pasos']}
            rows={dashboard.missions.map((mission) => [
              <div className="max-w-md"><p className="text-sm font-semibold text-white">{mission.title}</p><p className="mt-1 text-xs text-zinc-500">{mission.summary}</p></div>,
              <StatusBadge status={mission.status} />,
              <StatusBadge status={mission.risk_level} />,
              <span className="text-sm text-zinc-300">{mission.requires_approval ? 'Requerida' : 'No requerida'}</span>,
              <span className="text-sm text-zinc-300">{mission.estimated_steps}</span>,
            ])}
          />
        </SectionCard>

        <SectionCard title="Panorama de control" subtitle="Indicadores directos para decidir si conviene iniciar más trabajo o contener la operación.">
          <DataTable
            columns={['Indicador', 'Valor', 'Lectura']}
            rows={[
              ['Misiones en espera de aprobación', dashboard.missions.filter((mission) => mission.status === 'waiting_for_approval').length, 'Trabajo frenado hasta recibir autorización humana.'],
              ['Tareas en curso', dashboard.metrics.running_tasks, 'Carga de ejecución real actualmente corriendo debajo del centro de mando.'],
              ['Alertas críticas', dashboard.metrics.critical_alerts, 'Señales severas que exigen revisión antes de abrir nuevos frentes.'],
              ['Runtime OpenClaw', formatDisplayText(String(dashboard.openClawStatus.state ?? 'desconocido')), 'Estado más reciente del motor operativo conectado.'],
            ]}
          />
        </SectionCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard title="Últimas ejecuciones" subtitle="Señales rápidas del plano de ejecución para validar throughput y estabilidad.">
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

        <SectionCard title="Alertas recientes" subtitle="Eventos de mayor severidad visibles desde auditoría y gobernanza.">
          <DataTable
            columns={['Acción', 'Módulo', 'Severidad', 'Actor', 'Resultado']}
            rows={dashboard.alerts.map((alert) => [
              alert.action,
              alert.module_name,
              <StatusBadge status={alert.severity} />,
              alert.actor,
              formatDisplayText(alert.result_status),
            ])}
          />
        </SectionCard>
      </div>
    </PageShell>
  );
}
