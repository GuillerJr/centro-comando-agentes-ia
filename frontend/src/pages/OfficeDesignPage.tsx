import { useEffect, useMemo, useState } from 'react';
import { Bot, CheckCircle2, CircleDot, ClipboardList, GitBranch, ShieldAlert, Sparkles, Waypoints } from 'lucide-react';
import { commandCenterApi } from '../api/commandCenterApi';
import { Button } from '../components/button';
import { EmptyState, ErrorState, formatDateTime, formatDisplayText, InfoPanel, LoadingState, MetricPill, PageShell, SectionCard, StatsGrid, StatusBadge } from '../components/ui';
import type { Agent, Approval, Skill, Task, TaskRun } from '../types/domain';

type OfficeSnapshot = {
  agents: Agent[];
  tasks: Task[];
  skills: Skill[];
  runs: TaskRun[];
  approvals: Approval[];
};

type OfficeStation = {
  id: string;
  title: string;
  description: string;
  icon: typeof Bot;
  tone: 'default' | 'success' | 'warning' | 'danger';
  agents: Agent[];
  tasks: Task[];
};

const stationDefinitions: Array<Pick<OfficeStation, 'id' | 'title' | 'description' | 'icon' | 'tone'>> = [
  {
    id: 'arquitectura',
    title: 'Mesa de arquitectura',
    description: 'Define estructura, contratos y dirección técnica general del sistema.',
    icon: Sparkles,
    tone: 'default',
  },
  {
    id: 'ejecucion',
    title: 'Línea de ejecución',
    description: 'Empuja implementación activa, coordinación técnica y entrega operativa.',
    icon: ClipboardList,
    tone: 'success',
  },
  {
    id: 'calidad',
    title: 'Control de calidad',
    description: 'Revisa estado, trazabilidad y señales de error o trabajo sensible.',
    icon: ShieldAlert,
    tone: 'warning',
  },
  {
    id: 'integraciones',
    title: 'Núcleo de integraciones',
    description: 'Conecta capacidades, skills y servicios externos para ampliar el sistema.',
    icon: Waypoints,
    tone: 'default',
  },
];

function buildOfficeStations(snapshot: OfficeSnapshot): OfficeStation[] {
  return stationDefinitions.map((station, index) => {
    const agents = snapshot.agents.filter((agent) => {
      const source = `${agent.agent_type} ${agent.description} ${agent.name}`.toLowerCase();
      if (station.id === 'arquitectura') return source.includes('architect') || source.includes('design') || source.includes('orchestr');
      if (station.id === 'ejecucion') return source.includes('executor') || source.includes('build') || source.includes('engineer');
      if (station.id === 'calidad') return source.includes('observer') || source.includes('audit') || source.includes('qa');
      return source.includes('mcp') || source.includes('integration') || source.includes('backend') || source.includes('database');
    });

    const tasks = snapshot.tasks.filter((task) => {
      const source = `${task.task_type} ${task.title} ${task.description}`.toLowerCase();
      if (station.id === 'arquitectura') return source.includes('design') || source.includes('architecture') || source.includes('governance');
      if (station.id === 'ejecucion') return source.includes('frontend') || source.includes('backend') || source.includes('fullstack') || task.status === 'running';
      if (station.id === 'calidad') return source.includes('audit') || source.includes('review') || task.status === 'failed' || task.status === 'awaiting_approval';
      return source.includes('mcp') || source.includes('database') || source.includes('integration');
    });

    const selectedAgents = agents.length > 0 ? agents : snapshot.agents.filter((_, agentIndex) => agentIndex % stationDefinitions.length === index).slice(0, 2);
    const selectedTasks = tasks.length > 0 ? tasks : snapshot.tasks.filter((_, taskIndex) => taskIndex % stationDefinitions.length === index).slice(0, 2);

    return {
      ...station,
      agents: selectedAgents,
      tasks: selectedTasks,
    };
  });
}

function deriveInteractionFeed(snapshot: OfficeSnapshot) {
  return snapshot.tasks.slice(0, 6).map((task, index) => {
    const leadSkill = snapshot.skills.find((skill) => skill.id === task.lead_skill_id);
    const run = snapshot.runs.find((item) => item.task_id === task.id);
    const approval = snapshot.approvals.find((item) => item.task_id === task.id && item.status === 'pending');

    return {
      id: task.id,
      title: task.title,
      status: task.status,
      source: leadSkill?.canonical_name ?? 'coordinación interna',
      destination: approval ? 'bandeja de aprobaciones' : run ? 'motor de ejecución' : 'cola operativa',
      summary: approval
        ? 'La tarea requiere decisión humana antes de seguir avanzando.'
        : run
          ? `La tarea ya generó una ejecución en modo ${formatDisplayText(run.execution_mode)}.`
          : 'La tarea todavía está coordinándose dentro de la oficina digital.',
      timestamp: run?.executed_at ?? task.started_at ?? task.created_at,
      index,
    };
  });
}

export function OfficeDesignPage() {
  const [snapshot, setSnapshot] = useState<OfficeSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOffice = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [agents, tasks, skills, runs, approvals] = await Promise.all([
        commandCenterApi.getAgents(),
        commandCenterApi.getTasks(),
        commandCenterApi.getSkills(),
        commandCenterApi.getTaskRunsAll(),
        commandCenterApi.getApprovals(),
      ]);
      setSnapshot({ agents, tasks, skills, runs, approvals });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo construir la oficina digital.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadOffice();
  }, []);

  const stations = useMemo(() => (snapshot ? buildOfficeStations(snapshot) : []), [snapshot]);
  const interactionFeed = useMemo(() => (snapshot ? deriveInteractionFeed(snapshot) : []), [snapshot]);

  if (error) return <ErrorState message={error} action={<Button onClick={() => void loadOffice()}>Reintentar</Button>} />;
  if (isLoading) return <LoadingState label="Construyendo oficina digital..." />;
  if (!snapshot) return <EmptyState title="Sin oficina disponible" description="No se pudo reunir suficiente estado operativo para dibujar la interacción entre agentes." action={<Button onClick={() => void loadOffice()}>Actualizar</Button>} />;

  const activeAgents = snapshot.agents.filter((agent) => agent.status === 'active').length;
  const activeTasks = snapshot.tasks.filter((task) => task.status === 'running' || task.status === 'queued').length;
  const pendingApprovals = snapshot.approvals.filter((approval) => approval.status === 'pending').length;
  const runningRuns = snapshot.runs.filter((run) => run.status === 'running').length;

  return (
    <PageShell
      title="Diseño de oficina"
      description="Superficie operativa que representa cómo se distribuyen agentes, tareas, handoffs y decisiones dentro de una oficina digital multiagente."
      action={<MetricPill label="Estaciones" value={String(stations.length)} tone="info" />}
    >
      <div className="metric-grid">
        <InfoPanel eyebrow="Agentes" title={`${activeAgents} activos`} description="Personal operativo actualmente disponible en la oficina digital." tone="success" />
        <InfoPanel eyebrow="Flujo" title={`${activeTasks} tareas vivas`} description="Trabajo en curso o en cola circulando entre estaciones operativas." tone={activeTasks > 0 ? 'warning' : 'default'} />
        <InfoPanel eyebrow="Aprobaciones" title={`${pendingApprovals} pendientes`} description="Puntos de decisión humana que interrumpen o desbloquean el flujo." tone={pendingApprovals > 0 ? 'warning' : 'success'} />
        <InfoPanel eyebrow="Ejecuciones" title={`${runningRuns} activas`} description="Procesos ya desplegados en el motor de ejecución del centro de comando." tone={runningRuns > 0 ? 'success' : 'default'} />
      </div>

      <StatsGrid
        className="summary-grid"
        items={[
          {
            eyebrow: 'Propósito',
            title: 'Oficina digital viva',
            description: 'La vista deja de ser solo CRUD y empieza a mostrar cómo se relacionan agentes, tareas y decisiones.',
            tone: 'default',
          },
          {
            eyebrow: 'Coordinación',
            title: `${stations.reduce((total, station) => total + station.agents.length, 0)} asignaciones visibles`,
            description: 'Distribución visible de agentes en estaciones operativas con foco en colaboración y handoffs.',
            tone: 'success',
          },
          {
            eyebrow: 'Limitación actual',
            title: 'Simulación basada en datos reales',
            description: 'La vista deriva relaciones en frontend porque todavía no existe un motor espacial dedicado en backend.',
            tone: 'warning',
          },
        ]}
      />

      <div className="grid gap-5 xl:grid-cols-[1.12fr_0.88fr]">
        <SectionCard title="Plano operativo" subtitle="Estaciones de trabajo que distribuyen agentes y tareas por rol dentro de la oficina digital.">
          <div className="grid gap-4 xl:grid-cols-2">
            {stations.map((station) => {
              const Icon = station.icon;
              return (
                <article key={station.id} className="surface-muted p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04] text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-white">{station.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-zinc-400">{station.description}</p>
                      </div>
                    </div>
                    <StatusBadge status={station.tone === 'success' ? 'active' : station.tone === 'warning' ? 'pending' : 'connected'} />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[16px] border border-white/8 bg-black/20 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Agentes en estación</p>
                      <div className="mt-3 space-y-2">
                        {station.agents.length === 0 ? (
                          <p className="text-sm text-zinc-500">Sin agentes asignados por ahora.</p>
                        ) : (
                          station.agents.slice(0, 3).map((agent) => (
                            <div key={agent.id} className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-medium text-white">{agent.name}</p>
                                <StatusBadge status={agent.status} />
                              </div>
                              <p className="mt-1 text-xs leading-5 text-zinc-400">{formatDisplayText(agent.agent_type)}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="rounded-[16px] border border-white/8 bg-black/20 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Trabajo asociado</p>
                      <div className="mt-3 space-y-2">
                        {station.tasks.length === 0 ? (
                          <p className="text-sm text-zinc-500">Sin tareas ligadas en este momento.</p>
                        ) : (
                          station.tasks.slice(0, 3).map((task) => (
                            <div key={task.id} className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-medium text-white">{task.title}</p>
                                <StatusBadge status={task.status} />
                              </div>
                              <p className="mt-1 text-xs leading-5 text-zinc-400">{formatDisplayText(task.task_type)}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard title="Flujo de interacción" subtitle="Narrativa operativa de cómo se están moviendo handoffs y decisiones entre agentes y módulos.">
          <div className="space-y-3">
            {interactionFeed.length === 0 ? (
              <EmptyState title="Sin interacción visible" description="Todavía no hay suficientes tareas o ejecuciones para construir un flujo de oficina útil." />
            ) : (
              interactionFeed.map((interaction) => (
                <div key={interaction.id} className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
                        <CircleDot className="h-3.5 w-3.5" />
                        <span>{interaction.source}</span>
                        <GitBranch className="h-3.5 w-3.5" />
                        <span>{interaction.destination}</span>
                      </div>
                      <h3 className="mt-2 text-base font-semibold text-white">{interaction.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">{interaction.summary}</p>
                    </div>
                    <StatusBadge status={interaction.status} />
                  </div>
                  <div className="mt-4 flex flex-col gap-1 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
                    <span>Secuencia #{interaction.index + 1}</span>
                    <span>{formatDateTime(interaction.timestamp)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title="Nodos humanos y automáticos" subtitle="Lectura de dónde interviene una persona y dónde avanza solo la capa multiagente.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="surface-muted p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-300">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Bandeja humana</p>
                  <p className="text-xs leading-5 text-zinc-400">Validaciones, aprobaciones y desbloqueos manuales.</p>
                </div>
              </div>
              <p className="mt-4 text-3xl font-semibold text-white">{pendingApprovals}</p>
            </div>
            <div className="surface-muted p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Circuito autónomo</p>
                  <p className="text-xs leading-5 text-zinc-400">Runs y coordinación que avanzan sin intervención humana directa.</p>
                </div>
              </div>
              <p className="mt-4 text-3xl font-semibold text-white">{runningRuns}</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Capacidades activas en la oficina" subtitle="Mapa corto de skills visibles que hoy alimentan la coordinación entre estaciones.">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {snapshot.skills.slice(0, 9).map((skill) => (
              <div key={skill.id} className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">{skill.canonical_name}</p>
                  <StatusBadge status={skill.status} />
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{skill.description}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-zinc-500">{formatDisplayText(skill.skill_type)}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
