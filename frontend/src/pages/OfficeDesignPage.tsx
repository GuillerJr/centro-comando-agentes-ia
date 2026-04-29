import { useEffect, useMemo, useState } from 'react';
import { Bot, CheckCircle2, CircleDot, Clock3, Cpu, ShieldAlert, Sparkles } from 'lucide-react';
import { commandCenterApi } from '../api/commandCenterApi';
import { Button } from '../components/button';
import { EmptyState, ErrorState, formatDateTime, formatDisplayText, InfoPanel, LoadingState, MetricPill, PageShell, SectionCard, StatusBadge } from '../components/ui';
import type { Agent, Approval, Skill, Task, TaskRun } from '../types/domain';

type OfficeSnapshot = {
  agents: Agent[];
  tasks: Task[];
  skills: Skill[];
  runs: TaskRun[];
  approvals: Approval[];
};

type OfficeRoom = {
  id: string;
  title: string;
  subtitle: string;
  accent: string;
  x: number;
  y: number;
  w: number;
  h: number;
  agents: Agent[];
  tasks: Task[];
};

function pickRoomAgents(snapshot: OfficeSnapshot, predicate: (agent: Agent) => boolean, fallbackOffset: number) {
  const selected = snapshot.agents.filter(predicate);
  return selected.length > 0 ? selected.slice(0, 3) : snapshot.agents.slice(fallbackOffset, fallbackOffset + 3);
}

function pickRoomTasks(snapshot: OfficeSnapshot, predicate: (task: Task) => boolean, fallbackOffset: number) {
  const selected = snapshot.tasks.filter(predicate);
  return selected.length > 0 ? selected.slice(0, 2) : snapshot.tasks.slice(fallbackOffset, fallbackOffset + 2);
}

function deriveRooms(snapshot: OfficeSnapshot): OfficeRoom[] {
  return [
    {
      id: 'war-room',
      title: 'Sala de estrategia',
      subtitle: 'Arquitectura, coordinación y decisiones centrales.',
      accent: 'from-fuchsia-500/60 to-violet-500/30',
      x: 0,
      y: 0,
      w: 7,
      h: 4,
      agents: pickRoomAgents(snapshot, (agent) => /architect|orchestr|design/i.test(`${agent.agent_type} ${agent.description}`), 0),
      tasks: pickRoomTasks(snapshot, (task) => /design|architecture|governance/i.test(`${task.task_type} ${task.title}`), 0),
    },
    {
      id: 'build-bay',
      title: 'Bahía de ejecución',
      subtitle: 'Implementación, runs y entrega activa.',
      accent: 'from-sky-500/60 to-cyan-500/30',
      x: 7,
      y: 0,
      w: 5,
      h: 3,
      agents: pickRoomAgents(snapshot, (agent) => /engineer|executor|build/i.test(`${agent.agent_type} ${agent.description}`), 1),
      tasks: pickRoomTasks(snapshot, (task) => task.status === 'running' || /frontend|backend|fullstack/i.test(`${task.task_type} ${task.title}`), 1),
    },
    {
      id: 'quality-pod',
      title: 'Pod de control',
      subtitle: 'Aprobaciones, auditoría y revisión sensible.',
      accent: 'from-amber-500/60 to-orange-500/30',
      x: 12,
      y: 0,
      w: 4,
      h: 5,
      agents: pickRoomAgents(snapshot, (agent) => /observer|review|audit|qa/i.test(`${agent.agent_type} ${agent.description}`), 2),
      tasks: pickRoomTasks(snapshot, (task) => task.status === 'awaiting_approval' || task.status === 'failed', 2),
    },
    {
      id: 'integration-lab',
      title: 'Laboratorio de integraciones',
      subtitle: 'MCP, skills y enlaces con plataforma.',
      accent: 'from-emerald-500/60 to-teal-500/30',
      x: 0,
      y: 4,
      w: 6,
      h: 4,
      agents: pickRoomAgents(snapshot, (agent) => /mcp|backend|database|integration/i.test(`${agent.agent_type} ${agent.description}`), 3),
      tasks: pickRoomTasks(snapshot, (task) => /mcp|database|integration/i.test(`${task.task_type} ${task.title}`), 3),
    },
    {
      id: 'focus-desks',
      title: 'Zona de enfoque',
      subtitle: 'Tareas individuales en curso y coordinación fina.',
      accent: 'from-rose-500/60 to-pink-500/30',
      x: 6,
      y: 3,
      w: 6,
      h: 5,
      agents: snapshot.agents.filter((agent) => agent.status === 'active').slice(0, 3),
      tasks: snapshot.tasks.filter((task) => task.status === 'queued' || task.status === 'pending').slice(0, 2),
    },
    {
      id: 'observability',
      title: 'Centro de observabilidad',
      subtitle: 'Monitoreo de salud, logs y estado vivo.',
      accent: 'from-indigo-500/60 to-blue-500/30',
      x: 12,
      y: 5,
      w: 4,
      h: 3,
      agents: snapshot.agents.slice(0, 2),
      tasks: snapshot.tasks.slice(0, 2),
    },
  ];
}

function MiniAvatar({ label, status }: { label: string; status: string }) {
  const initials = label
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="office-avatar">
      <div className="office-avatar__figure">{initials}</div>
      <div className={`office-avatar__dot ${status === 'active' ? 'office-avatar__dot--active' : 'office-avatar__dot--idle'}`} />
    </div>
  );
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

  const rooms = useMemo(() => (snapshot ? deriveRooms(snapshot) : []), [snapshot]);
  const pendingApprovals = snapshot?.approvals.filter((item) => item.status === 'pending') ?? [];
  const activeRuns = snapshot?.runs.filter((item) => item.status === 'running') ?? [];
  const activeAgents = snapshot?.agents.filter((agent) => agent.status === 'active') ?? [];
  const activeSkills = snapshot?.skills.filter((skill) => skill.status === 'active') ?? [];

  if (error) return <ErrorState message={error} action={<Button onClick={() => void loadOffice()}>Reintentar</Button>} />;
  if (isLoading) return <LoadingState label="Construyendo la oficina digital..." />;
  if (!snapshot) return <EmptyState title="Sin oficina disponible" description="No fue posible reunir el estado operativo necesario para dibujar la oficina." action={<Button onClick={() => void loadOffice()}>Actualizar</Button>} />;

  return (
    <PageShell
      title="Diseño de oficina"
      description="Mapa operativo del centro de comando, donde los agentes habitan salas, se reparten trabajo y muestran handoffs entre decisiones humanas y ejecución automática."
      action={<MetricPill label="Salas" value={String(rooms.length)} tone="info" />}
    >
      <div className="metric-grid">
        <InfoPanel eyebrow="Personal activo" title={`${activeAgents.length} agentes disponibles`} description="Agentes visibles en el mapa y listos para ejecutar o coordinar trabajo." tone="success" />
        <InfoPanel eyebrow="Capacidad viva" title={`${activeRuns.length} ejecuciones en curso`} description="Runs activas moviéndose por la oficina digital en este momento." tone={activeRuns.length > 0 ? 'success' : 'default'} />
        <InfoPanel eyebrow="Decisión humana" title={`${pendingApprovals.length} bloqueos pendientes`} description="Puntos donde la oficina necesita aprobación antes de seguir avanzando." tone={pendingApprovals.length > 0 ? 'warning' : 'default'} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.18fr_0.82fr]">
        <SectionCard title="Plano de oficina" subtitle="Vista espacial inspirada en una oficina digital donde cada sala representa una función del sistema multiagente.">
          <div className="office-board">
            <div className="office-board__grid" />
            {rooms.map((room) => (
              <section
                key={room.id}
                className={`office-room bg-gradient-to-br ${room.accent}`}
                style={{ gridColumn: `${room.x + 1} / span ${room.w}`, gridRow: `${room.y + 1} / span ${room.h}` }}
              >
                <div className="office-room__header">
                  <div>
                    <p className="office-room__title">{room.title}</p>
                    <p className="office-room__subtitle">{room.subtitle}</p>
                  </div>
                  <span className="office-room__badge">{room.agents.length} agentes</span>
                </div>

                <div className="office-room__avatars">
                  {room.agents.map((agent) => (
                    <div key={agent.id} className="office-room__agent">
                      <MiniAvatar label={agent.name} status={agent.status} />
                      <div className="office-room__agent-meta">
                        <span className="office-room__agent-name">{agent.name}</span>
                        <span className="office-room__agent-role">{formatDisplayText(agent.agent_type)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="office-room__tasks">
                  {room.tasks.map((task) => (
                    <div key={task.id} className="office-room__task-chip">
                      <CircleDot className="h-3.5 w-3.5" />
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
          <SectionCard title="Pulso operativo" subtitle="Señales rápidas del estado de la oficina en este momento.">
            <div className="space-y-3">
              <div className="surface-muted flex items-start gap-3 p-4">
                <Cpu className="mt-0.5 h-5 w-5 text-sky-300" />
                <div>
                  <p className="text-sm font-semibold text-white">Circuito automático</p>
                  <p className="mt-1 text-sm leading-6 text-zinc-400">{activeRuns.length > 0 ? `${activeRuns.length} ejecuciones están moviendo trabajo entre salas y módulos.` : 'No hay ejecuciones en curso ahora mismo.'}</p>
                </div>
              </div>
              <div className="surface-muted flex items-start gap-3 p-4">
                <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-300" />
                <div>
                  <p className="text-sm font-semibold text-white">Nodos humanos</p>
                  <p className="mt-1 text-sm leading-6 text-zinc-400">{pendingApprovals.length > 0 ? `${pendingApprovals.length} aprobaciones están esperando decisión manual.` : 'No hay bloqueos humanos pendientes en la bandeja.'}</p>
                </div>
              </div>
              <div className="surface-muted flex items-start gap-3 p-4">
                <Sparkles className="mt-0.5 h-5 w-5 text-fuchsia-300" />
                <div>
                  <p className="text-sm font-semibold text-white">Capacidades conectadas</p>
                  <p className="mt-1 text-sm leading-6 text-zinc-400">{activeSkills.length} capacidades activas alimentan el movimiento interno de la oficina.</p>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Agenda viva" subtitle="Eventos y handoffs que están definiendo el movimiento de la oficina digital.">
            <div className="space-y-3">
              {snapshot.tasks.slice(0, 5).map((task) => {
                const run = snapshot.runs.find((item) => item.task_id === task.id);
                const approval = snapshot.approvals.find((item) => item.task_id === task.id && item.status === 'pending');
                return (
                  <div key={task.id} className="surface-muted p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white">{task.title}</p>
                        <p className="mt-1 text-sm leading-6 text-zinc-400">
                          {approval
                            ? `Se desvió a decisión humana por ${formatDisplayText(approval.approval_type)}.`
                            : run
                              ? `Está recorriendo la oficina a través del motor ${formatDisplayText(run.execution_mode)}.`
                              : 'Sigue en coordinación interna dentro de la oficina.'}
                        </p>
                      </div>
                      <StatusBadge status={task.status} />
                    </div>
                    <div className="mt-3 flex flex-col gap-1 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
                      <span>{formatDisplayText(task.task_type)}</span>
                      <span>{formatDateTime(run?.executed_at ?? task.started_at ?? task.created_at)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard title="Capacidades que sostienen la oficina" subtitle="Skills activas que hoy soportan la coordinación entre salas y el movimiento de trabajo.">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {snapshot.skills.slice(0, 9).map((skill) => (
              <div key={skill.id} className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">{skill.canonical_name}</p>
                  <StatusBadge status={skill.status} />
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{skill.description}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Aprobaciones que interrumpen el flujo" subtitle="Momentos donde la oficina detiene automatismos y requiere intervención humana explícita.">
          {pendingApprovals.length === 0 ? (
            <EmptyState title="Sin interrupciones humanas" description="La oficina digital no tiene aprobaciones pendientes en este momento." />
          ) : (
            <div className="space-y-3">
              {pendingApprovals.slice(0, 4).map((approval) => (
                <div key={approval.id} className="surface-muted p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">{formatDisplayText(approval.approval_type)}</p>
                      <p className="mt-1 text-sm leading-6 text-zinc-400">{approval.reason}</p>
                    </div>
                    <StatusBadge status={approval.status} />
                  </div>
                  <div className="mt-3 flex flex-col gap-1 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
                    <span>{approval.requested_by}</span>
                    <span>{approval.task_id ? `Tarea ${approval.task_id.slice(0, 8)}` : 'Sin tarea vinculada'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </PageShell>
  );
}
