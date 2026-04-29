import { useEffect, useMemo, useState } from 'react';
import { Bot, CheckCircle2, Clock3, ShieldAlert, Sparkles, Waypoints } from 'lucide-react';
import { commandCenterApi } from '../api/commandCenterApi';
import { Button } from '../components/button';
import { EmptyState, ErrorState, formatDateTime, formatDisplayText, LoadingState, MetricPill, PageShell, SectionCard, StatusBadge } from '../components/ui';
import type { OfficeState } from '../types/domain';

function roomTone(accent: string) {
  return accent || 'from-slate-500/40 to-slate-700/20';
}

export function OfficeDesignPage() {
  const [state, setState] = useState<OfficeState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOffice = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await commandCenterApi.getCurrentOfficeState();
      setState(data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo cargar la oficina digital.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadOffice();
  }, []);

  const totalAssignments = useMemo(() => state?.zones.reduce((sum, zone) => sum + zone.agents.length, 0) ?? 0, [state]);

  if (error) return <ErrorState message={error} action={<Button onClick={() => void loadOffice()}>Reintentar</Button>} />;
  if (isLoading) return <LoadingState label="Cargando oficina digital..." />;
  if (!state) return <EmptyState title="Sin oficina configurada" description="Todavía no existe un snapshot espacial disponible para mostrar." action={<Button onClick={() => void loadOffice()}>Actualizar</Button>} />;

  return (
    <PageShell
      title="Diseño de oficina"
      description="Mapa operativo persistente del centro de comando. Ahora la oficina ya no es solo una interpretación visual, sino un dominio espacial real con zonas, estaciones y asignaciones vivas."
      action={<MetricPill label="Oficina" value={state.office.name} tone="info" />}
    >
      <div className="metric-grid xl:grid-cols-4">
        <div className="panel-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Zonas activas</p>
          <p className="mt-2 text-3xl font-semibold text-white">{state.metrics.zones}</p>
          <p className="mt-2 text-sm text-zinc-400">Salas persistidas en el backend espacial.</p>
        </div>
        <div className="panel-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Estaciones ocupadas</p>
          <p className="mt-2 text-3xl font-semibold text-white">{state.metrics.occupiedStations}/{state.metrics.stations}</p>
          <p className="mt-2 text-sm text-zinc-400">Puestos con presencia real de agentes asignados.</p>
        </div>
        <div className="panel-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Agentes presentes</p>
          <p className="mt-2 text-3xl font-semibold text-white">{state.metrics.activeAgents}</p>
          <p className="mt-2 text-sm text-zinc-400">Personal activo desplegado en la oficina digital.</p>
        </div>
        <div className="panel-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Bloqueos humanos</p>
          <p className="mt-2 text-3xl font-semibold text-white">{state.metrics.pendingApprovals}</p>
          <p className="mt-2 text-sm text-zinc-400">Aprobaciones que frenan el flujo automático.</p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.16fr_0.84fr]">
        <SectionCard
          title="Plano espacial persistente"
          subtitle="Cada sala y estación de este plano vive en backend. La vista ya no se deduce solo en frontend, sino que responde a un layout real del producto."
          action={<MetricPill label="Asignaciones" value={String(totalAssignments)} tone="success" />}
        >
          <div className="office-board">
            <div className="office-board__grid" />
            {state.zones.map((zone) => (
              <section
                key={zone.id}
                className={`office-room bg-gradient-to-br ${roomTone(zone.accent)}`}
                style={{ gridColumn: `${zone.x} / span ${zone.w}`, gridRow: `${zone.y} / span ${zone.h}` }}
              >
                <div className="office-room__header">
                  <div>
                    <p className="office-room__title">{zone.name}</p>
                    <p className="office-room__subtitle">{zone.subtitle}</p>
                  </div>
                  <span className="office-room__badge">{zone.stations.length} estaciones</span>
                </div>

                <div className="grid gap-2">
                  {zone.stations.slice(0, 4).map((station) => {
                    const stationed = zone.agents.filter((item) => item.stationId === station.id);
                    return (
                      <div key={station.id} className="rounded-2xl border border-white/10 bg-black/15 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold uppercase tracking-[0.16em] text-white/90">{station.name}</p>
                            <p className="mt-1 text-[11px] text-zinc-300">{formatDisplayText(station.stationType)}</p>
                          </div>
                          <StatusBadge status={station.status} />
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {stationed.length > 0 ? (
                            stationed.slice(0, 3).map((assignment) => (
                              <div key={assignment.assignmentId} className="office-room__task-chip">
                                <Bot className="h-3.5 w-3.5" />
                                <span>{assignment.agent.name}</span>
                              </div>
                            ))
                          ) : (
                            <div className="office-room__task-chip opacity-70">
                              <Clock3 className="h-3.5 w-3.5" />
                              <span>Sin presencia activa</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="office-room__tasks">
                  {zone.tasks.slice(0, 2).map((task) => (
                    <div key={task.id} className="office-room__task-chip">
                      <Waypoints className="h-3.5 w-3.5" />
                      <span>{task.title}</span>
                    </div>
                  ))}
                </div>
              </section>
            ))}
            <div className="office-flow office-flow--one" />
            <div className="office-flow office-flow--two" />
            <div className="office-flow office-flow--three" />
          </div>
        </SectionCard>

        <div className="space-y-5">
          <SectionCard title="Pulso operativo" subtitle="Lo que está ocurriendo ahora mismo dentro del mapa espacial.">
            <div className="space-y-3">
              <div className="surface-muted flex items-start gap-3 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-300" />
                <div>
                  <p className="text-sm font-semibold text-white">Trabajo asignado</p>
                  <p className="mt-1 text-sm leading-6 text-zinc-400">{state.metrics.assignedTasks} tareas están conectadas directamente a zonas y estaciones persistentes.</p>
                </div>
              </div>
              <div className="surface-muted flex items-start gap-3 p-4">
                <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-300" />
                <div>
                  <p className="text-sm font-semibold text-white">Aprobaciones pendientes</p>
                  <p className="mt-1 text-sm leading-6 text-zinc-400">{state.pendingApprovals.length > 0 ? `${state.pendingApprovals.length} decisiones humanas siguen abiertas.` : 'No hay bloqueos humanos pendientes ahora mismo.'}</p>
                </div>
              </div>
              <div className="surface-muted flex items-start gap-3 p-4">
                <Sparkles className="mt-0.5 h-5 w-5 text-fuchsia-300" />
                <div>
                  <p className="text-sm font-semibold text-white">Capacidades activas</p>
                  <p className="mt-1 text-sm leading-6 text-zinc-400">{state.activeSkills.length} skills activas alimentan la operación de la oficina.</p>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Tareas vivas" subtitle="Flujo operativo reciente vinculado a la estructura espacial de la oficina.">
            <div className="space-y-3">
              {state.recentTasks.length === 0 ? (
                <EmptyState title="Sin movimiento reciente" description="Todavía no hay tareas recientes enlazadas al pulso de la oficina." />
              ) : (
                state.recentTasks.map((task) => (
                  <div key={task.id} className="surface-muted p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white">{task.title}</p>
                        <p className="mt-1 text-sm leading-6 text-zinc-400">{task.description}</p>
                      </div>
                      <StatusBadge status={task.status} />
                    </div>
                    <div className="mt-3 flex flex-col gap-1 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
                      <span>{formatDisplayText(task.task_type)}</span>
                      <span>{formatDateTime(task.started_at ?? task.created_at)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard title="Presencia por zona" subtitle="Asignaciones actuales de agentes a estaciones dentro de la oficina persistente.">
          <div className="space-y-3">
            {state.zones.map((zone) => (
              <div key={zone.id} className="surface-muted p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{zone.name}</p>
                    <p className="mt-1 text-sm text-zinc-400">{zone.agents.length} agentes, {zone.tasks.length} tareas enlazadas</p>
                  </div>
                  <StatusBadge status={zone.zoneType} />
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {zone.agents.length > 0 ? (
                    zone.agents.slice(0, 4).map((assignment) => (
                      <div key={assignment.assignmentId} className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">{assignment.agent.name}</p>
                            <p className="mt-1 text-xs text-zinc-400">{assignment.stationName} · {formatDisplayText(assignment.assignmentRole)}</p>
                          </div>
                          <StatusBadge status={assignment.presenceStatus} />
                        </div>
                        {assignment.task ? <p className="mt-2 text-xs leading-5 text-zinc-400">Trabajando en: {assignment.task.title}</p> : <p className="mt-2 text-xs leading-5 text-zinc-500">Sin tarea enlazada ahora mismo.</p>}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-zinc-500">No hay asignaciones activas en esta zona.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Aprobaciones y ejecuciones" subtitle="Puntos donde el mapa espacial conversa con la operación real del sistema.">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Ejecuciones activas</p>
              <div className="mt-3 space-y-3">
                {state.activeRuns.length > 0 ? (
                  state.activeRuns.slice(0, 4).map((run) => (
                    <div key={run.id} className="surface-muted p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white">{run.requested_action}</p>
                          <p className="mt-1 text-sm text-zinc-400">Modo {formatDisplayText(run.execution_mode)} · traza {run.trace_id.slice(0, 8)}</p>
                        </div>
                        <StatusBadge status={run.status} />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">No hay ejecuciones activas ahora mismo.</p>
                )}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Aprobaciones pendientes</p>
              <div className="mt-3 space-y-3">
                {state.pendingApprovals.length > 0 ? (
                  state.pendingApprovals.slice(0, 4).map((approval) => (
                    <div key={approval.id} className="surface-muted p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white">{formatDisplayText(approval.approval_type)}</p>
                          <p className="mt-1 text-sm leading-6 text-zinc-400">{approval.reason}</p>
                        </div>
                        <StatusBadge status={approval.status} />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">No hay aprobaciones pendientes.</p>
                )}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
