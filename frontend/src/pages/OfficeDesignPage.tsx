import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Bot, Plus, Trash2 } from 'lucide-react';
import { commandCenterApi } from '../api/commandCenterApi';
import { Button } from '../components/button';
import { Input } from '../components/input';
import { Modal } from '../components/modal';
import { OfficePixiScene } from '../components/OfficePixiScene';
import { ActionFeedback, EmptyState, ErrorState, FormField, LoadingState, MetricPill, PageShell, SectionCard, StatusBadge, formatDateTime, formatDisplayText } from '../components/ui';
import type { Agent, OfficeState, OfficeZone, OfficeZoneAgent, OfficeZoneTask, Task } from '../types/domain';

type ZoneForm = { code: string; name: string; subtitle: string; zoneType: string; accent: string; gridX: number; gridY: number; gridW: number; gridH: number; displayOrder: number };
type StationForm = { zoneId: string; code: string; name: string; stationType: string; status: string; capacity: number };
type AssignmentForm = { stationId: string; agentId: string; taskId: string; assignmentRole: string; presenceStatus: string; isPrimary: boolean; notes: string };

type ZoneSummary = {
  id: string;
  name: string;
  subtitle: string;
  accent: string;
  x: number;
  y: number;
  w: number;
  h: number;
  stations: OfficeZone['stations'];
  agents: OfficeZoneAgent[];
  tasks: OfficeZoneTask[];
  activeRuns: OfficeState['activeRuns'];
  pendingApprovals: OfficeState['pendingApprovals'];
  occupiedStations: number;
  focusingAgents: number;
  reviewingAgents: number;
  awayAgents: number;
  activityScore: number;
  pulseTone: 'idle' | 'active' | 'focus' | 'blocked';
};

type FlowLink = {
  id: string;
  fromZoneId: string;
  toZoneId: string;
  taskId: string;
  taskTitle: string;
  taskStatus: string;
  left: string;
  top: string;
  width: string;
  angle: string;
  distancePx: number;
};

const defaultZoneForm: ZoneForm = { code: '', name: '', subtitle: '', zoneType: 'control', accent: 'from-sky-500/60 to-cyan-500/30', gridX: 0, gridY: 0, gridW: 4, gridH: 3, displayOrder: 0 };
const defaultStationForm: StationForm = { zoneId: '', code: '', name: '', stationType: 'desk', status: 'available', capacity: 1 };
const defaultAssignmentForm: AssignmentForm = { stationId: '', agentId: '', taskId: '', assignmentRole: 'responsable', presenceStatus: 'present', isPrimary: true, notes: '' };

const presenceLabel = (status: string) => {
  if (status === 'focusing') return 'En foco';
  if (status === 'in_review') return 'En revisión';
  if (status === 'away') return 'Ausente';
  return 'Presente';
};

const getZoneTaskMap = (zone: OfficeZone) => {
  const taskMap = new Map<string, OfficeZoneTask>();
  (zone.tasks ?? []).forEach((task) => taskMap.set(task.id, task));
  (zone.agents ?? []).forEach((assignment) => {
    if (assignment.task) taskMap.set(assignment.task.id, assignment.task);
  });
  return taskMap;
};

export function OfficeDesignPage() {
  const [state, setState] = useState<OfficeState | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [zoneModalOpen, setZoneModalOpen] = useState(false);
  const [stationModalOpen, setStationModalOpen] = useState(false);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [editingStationId, setEditingStationId] = useState<string | null>(null);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [zoneForm, setZoneForm] = useState<ZoneForm>(defaultZoneForm);
  const [stationForm, setStationForm] = useState<StationForm>(defaultStationForm);
  const [assignmentForm, setAssignmentForm] = useState<AssignmentForm>(defaultAssignmentForm);

  const loadOffice = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [officeState, availableAgents, availableTasks] = await Promise.all([
        commandCenterApi.getCurrentOfficeState(),
        commandCenterApi.getAgents(),
        commandCenterApi.getTasks(),
      ]);
      setState(officeState);
      setAgents(availableAgents.filter((agent) => agent.status === 'active'));
      setTasks(availableTasks.filter((task) => !['completed', 'cancelled', 'failed'].includes(task.status)));
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

  const allStations = useMemo(
    () => state?.zones.flatMap((zone) => zone.stations.map((station) => ({ ...station, zoneId: zone.id, zoneName: zone.name }))) ?? [],
    [state],
  );

  const allAssignments = useMemo(
    () => state?.zones.flatMap((zone) => zone.agents.map((assignment) => ({ ...assignment, zoneId: zone.id, zoneName: zone.name }))) ?? [],
    [state],
  );

  const zoneSummaries = useMemo<ZoneSummary[]>(() => {
    if (!state) return [];

    return state.zones.map((zone) => {
      const zoneTaskIds = new Set(getZoneTaskMap(zone).keys());
      const activeRuns = state.activeRuns.filter((run) => zoneTaskIds.has(run.task_id));
      const pendingApprovals = state.pendingApprovals.filter((approval) => approval.task_id && zoneTaskIds.has(approval.task_id));
      const focusingAgents = zone.agents.filter((assignment) => assignment.presenceStatus === 'focusing').length;
      const reviewingAgents = zone.agents.filter((assignment) => assignment.presenceStatus === 'in_review').length;
      const awayAgents = zone.agents.filter((assignment) => assignment.presenceStatus === 'away').length;
      const occupiedStations = zone.stations.filter((station) => (station.assignmentCount ?? 0) > 0).length;
      const activityScore = (zone.agents.length * 2) + (zone.tasks.length * 3) + (activeRuns.length * 4) + (focusingAgents * 2) + reviewingAgents + occupiedStations - awayAgents;
      const pulseTone: ZoneSummary['pulseTone'] = pendingApprovals.length > 0 ? 'blocked' : focusingAgents > 0 || activeRuns.length > 0 ? 'focus' : zone.agents.length > 0 || zone.tasks.length > 0 ? 'active' : 'idle';

      return {
        id: zone.id,
        name: zone.name,
        subtitle: zone.subtitle,
        accent: zone.accent,
        x: zone.x,
        y: zone.y,
        w: zone.w,
        h: zone.h,
        stations: zone.stations,
        agents: zone.agents,
        tasks: zone.tasks,
        activeRuns,
        pendingApprovals,
        occupiedStations,
        focusingAgents,
        reviewingAgents,
        awayAgents,
        activityScore,
        pulseTone,
      };
    });
  }, [state]);

  const sortedZoneSummaries = useMemo(
    () => [...zoneSummaries].sort((left, right) => right.activityScore - left.activityScore),
    [zoneSummaries],
  );

  const leadZone = sortedZoneSummaries[0] ?? null;

  const flowLinks = useMemo<FlowLink[]>(() => {
    if (!state) return [];

    const taskZones = new Map<string, Array<{ zoneId: string; zoneName: string; task: OfficeZoneTask; x: number; y: number; w: number; h: number }>>();

    state.zones.forEach((zone) => {
      getZoneTaskMap(zone).forEach((task, taskId) => {
        const entries = taskZones.get(taskId) ?? [];
        if (!entries.some((entry) => entry.zoneId === zone.id)) {
          entries.push({ zoneId: zone.id, zoneName: zone.name, task, x: zone.x, y: zone.y, w: zone.w, h: zone.h });
        }
        taskZones.set(taskId, entries);
      });
    });

    return Array.from(taskZones.entries())
      .flatMap(([taskId, zonesWithTask]) => {
        if (zonesWithTask.length < 2) return [];

        const orderedZones = [...zonesWithTask].sort((left, right) => (left.x + left.y) - (right.x + right.y));
        return orderedZones.slice(0, -1).map((fromZone, index) => {
          const toZone = orderedZones[index + 1];
          const fromCenterX = ((fromZone.x + (fromZone.w / 2)) / state.office.gridColumns) * 100;
          const fromCenterY = ((fromZone.y + (fromZone.h / 2)) / state.office.gridRows) * 100;
          const toCenterX = ((toZone.x + (toZone.w / 2)) / state.office.gridColumns) * 100;
          const toCenterY = ((toZone.y + (toZone.h / 2)) / state.office.gridRows) * 100;
          const deltaX = toCenterX - fromCenterX;
          const deltaY = toCenterY - fromCenterY;
          const width = Math.hypot(deltaX, deltaY);
          const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

          return {
            id: `${taskId}-${fromZone.zoneId}-${toZone.zoneId}`,
            fromZoneId: fromZone.zoneId,
            toZoneId: toZone.zoneId,
            taskId,
            taskTitle: fromZone.task.title,
            taskStatus: fromZone.task.status,
            left: `${fromCenterX}%`,
            top: `${fromCenterY}%`,
            width: `${width}%`,
            angle: `${angle}deg`,
            distancePx: Math.round(width * 10),
          };
        });
      })
      .slice(0, 6);
  }, [state]);

  const handoffFeed = useMemo(() => {
    if (!state) return [];

    const zoneNames = new Map(state.zones.map((zone) => [zone.id, zone.name]));
    return flowLinks.map((link) => ({
      ...link,
      fromZoneName: zoneNames.get(link.fromZoneId) ?? 'Zona',
      toZoneName: zoneNames.get(link.toZoneId) ?? 'Zona',
    }));
  }, [flowLinks, state]);

  const liveTasks = state?.recentTasks.length ?? 0;
  const activeFlows = handoffFeed.length;
  const riskCount = state ? state.pendingApprovals.length + state.warnings.length : 0;

  const resetZoneForm = () => {
    setEditingZoneId(null);
    setZoneForm(defaultZoneForm);
    setZoneModalOpen(false);
  };

  const resetStationForm = () => {
    setEditingStationId(null);
    setStationForm(defaultStationForm);
    setStationModalOpen(false);
  };

  const resetAssignmentForm = () => {
    setEditingAssignmentId(null);
    setAssignmentForm(defaultAssignmentForm);
    setAssignmentModalOpen(false);
  };

  const runMutation = async (work: () => Promise<unknown>, successMessage: string, fallbackMessage: string) => {
    try {
      setIsSubmitting(true);
      setFeedback(null);
      setError(null);
      await work();
      setFeedback(successMessage);
      await loadOffice();
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : fallbackMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitZone = async (event: FormEvent) => {
    event.preventDefault();
    const succeeded = await runMutation(
      () => editingZoneId ? commandCenterApi.updateOfficeZone(editingZoneId, { ...zoneForm, metadata: {} }) : commandCenterApi.createOfficeZone({ ...zoneForm, metadata: {} }),
      editingZoneId ? 'La zona se actualizó correctamente.' : 'La zona se creó correctamente.',
      'No se pudo guardar la zona.',
    );
    if (succeeded) resetZoneForm();
  };

  const submitStation = async (event: FormEvent) => {
    event.preventDefault();
    const succeeded = await runMutation(
      () => editingStationId ? commandCenterApi.updateOfficeStation(editingStationId, { ...stationForm, metadata: {} }) : commandCenterApi.createOfficeStation({ ...stationForm, metadata: {} }),
      editingStationId ? 'La estación se actualizó correctamente.' : 'La estación se creó correctamente.',
      'No se pudo guardar la estación.',
    );
    if (succeeded) resetStationForm();
  };

  const submitAssignment = async (event: FormEvent) => {
    event.preventDefault();
    const payload = { ...assignmentForm, taskId: assignmentForm.taskId || null, notes: assignmentForm.notes || null, metadata: {} };
    const succeeded = await runMutation(
      () => editingAssignmentId ? commandCenterApi.updateOfficeAssignment(editingAssignmentId, payload) : commandCenterApi.createOfficeAssignment(payload),
      editingAssignmentId ? 'La asignación se actualizó correctamente.' : 'La asignación se creó correctamente.',
      'No se pudo guardar la asignación.',
    );
    if (succeeded) resetAssignmentForm();
  };

  if (error && !state) {
    return <ErrorState message={error} action={<Button onClick={() => void loadOffice()}>Reintentar</Button>} />;
  }

  if (isLoading) {
    return <LoadingState label="Cargando oficina digital..." />;
  }

  if (!state) {
    return <EmptyState title="Sin oficina configurada" description="Todavía no existe un snapshot espacial disponible para mostrar." action={<Button onClick={() => void loadOffice()}>Actualizar</Button>} />;
  }

  return (
    <PageShell
      title="Diseño de oficina"
      description="Capa visual viva sobre el backend espacial existente: presencia, foco, handoffs y bloqueos leíbles sin inventar infraestructura nueva."
      action={<MetricPill label="Oficina" value={state.office.name} tone="info" />}
    >
      {error ? <ActionFeedback tone="warning" message={error} /> : null}
      {feedback ? <ActionFeedback tone="success" message={feedback} /> : null}

      <section className="office-design-studio">
        <div className="office-design-studio__header">
          <div className="office-design-studio__copy">
            <p className="office-design-studio__eyebrow">Escena principal</p>
            <h3 className="office-design-studio__title">La oficina 2D pasa al centro de la lectura operativa</h3>
            <p className="office-design-studio__description">Se eliminó la capa de dashboard alrededor del mapa para concentrar presencia, handoffs, bloqueos y contexto espacial en una composición única: escena dominante con apoyo lateral compacto.</p>
          </div>

          <div className="office-design-studio__summary">
            <div className="office-design-studio__metric">
              <span>Zonas activas</span>
              <strong>{state.metrics.zones}</strong>
              <small>{leadZone ? `${leadZone.name} lidera el pulso` : 'Sin zonas destacadas'}</small>
            </div>
            <div className="office-design-studio__metric">
              <span>Agentes visibles</span>
              <strong>{state.metrics.activeAgents}</strong>
              <small>{totalAssignments} asignaciones persistidas</small>
            </div>
            <div className="office-design-studio__metric">
              <span>Flujo vivo</span>
              <strong>{activeFlows}</strong>
              <small>{liveTasks} tareas recientes enlazadas al mapa</small>
            </div>
            <div className="office-design-studio__metric">
              <span>Riesgos abiertos</span>
              <strong>{riskCount}</strong>
              <small>{state.metrics.pendingApprovals} aprobaciones pendientes</small>
            </div>
          </div>
        </div>

        <OfficePixiScene state={state} />
      </section>

      <div className="office-design-lower-grid">
        <SectionCard title="Administración espacial" subtitle="Se conserva el CRUD real, pero en una banda de soporte más compacta que no compite con la escena." action={<div className="flex flex-wrap gap-2"><Button onClick={() => setZoneModalOpen(true)}><Plus className="mr-2 h-4 w-4" />Zona</Button><Button variant="secondary" onClick={() => { if (state.zones[0]) setStationForm((current) => ({ ...current, zoneId: state.zones[0].id })); setStationModalOpen(true); }}><Plus className="mr-2 h-4 w-4" />Estación</Button><Button variant="ghost" onClick={() => { if (allStations[0]) setAssignmentForm((current) => ({ ...current, stationId: allStations[0].id })); if (agents[0]) setAssignmentForm((current) => ({ ...current, agentId: agents[0].id })); setAssignmentModalOpen(true); }}><Plus className="mr-2 h-4 w-4" />Asignación</Button></div>}>
          <div className="grid gap-5 xl:grid-cols-3">
          <div className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Zonas</p>
            {state.zones.map((zone) => (
              <div key={zone.id} className="surface-muted p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{zone.name}</p>
                    <p className="mt-1 text-sm text-zinc-400">{zone.subtitle}</p>
                    <p className="mt-2 text-xs text-zinc-500">Grid {zone.x},{zone.y} · {zone.w}x{zone.h}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => { setEditingZoneId(zone.id); setZoneForm({ code: zone.code, name: zone.name, subtitle: zone.subtitle, zoneType: zone.zoneType, accent: zone.accent, gridX: zone.x, gridY: zone.y, gridW: zone.w, gridH: zone.h, displayOrder: 0 }); setZoneModalOpen(true); }}>Editar</Button>
                    <Button size="sm" variant="ghost" disabled={isSubmitting} onClick={() => void runMutation(() => commandCenterApi.deleteOfficeZone(zone.id), 'La zona se eliminó correctamente.', 'No se pudo eliminar la zona.')}>Eliminar</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Estaciones</p>
            {allStations.map((station) => (
              <div key={station.id} className="surface-muted p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{station.name}</p>
                    <p className="mt-1 text-sm text-zinc-400">{station.zoneName} · {formatDisplayText(station.stationType)}</p>
                    <p className="mt-2 text-xs text-zinc-500">Capacidad {station.capacity} · {station.assignmentCount ?? 0} ocupadas</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => { setEditingStationId(station.id); setStationForm({ zoneId: station.zoneId, code: station.code, name: station.name, stationType: station.stationType, status: station.status, capacity: station.capacity }); setStationModalOpen(true); }}>Editar</Button>
                    <Button size="sm" variant="ghost" disabled={isSubmitting} onClick={() => void runMutation(() => commandCenterApi.deleteOfficeStation(station.id), 'La estación se eliminó correctamente.', 'No se pudo eliminar la estación.')}>Eliminar</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Asignaciones</p>
            {allAssignments.length > 0 ? allAssignments.map((assignment) => (
              <div key={assignment.assignmentId} className="surface-muted p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                      <Bot className="h-4 w-4 text-cyan-300" />
                      <span>{assignment.agent.name}</span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-400">{assignment.zoneName} · {assignment.stationName}</p>
                    <p className="mt-2 text-xs text-zinc-500">{presenceLabel(assignment.presenceStatus)} · {assignment.task?.title ?? formatDisplayText(assignment.assignmentRole)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => { setEditingAssignmentId(assignment.assignmentId); setAssignmentForm({ stationId: assignment.stationId, agentId: assignment.agent.id, taskId: assignment.task?.id ?? '', assignmentRole: assignment.assignmentRole, presenceStatus: assignment.presenceStatus, isPrimary: true, notes: assignment.notes ?? '' }); setAssignmentModalOpen(true); }}>Editar</Button>
                    <Button size="sm" variant="ghost" disabled={isSubmitting} onClick={() => void runMutation(() => commandCenterApi.deleteOfficeAssignment(assignment.assignmentId), 'La asignación se eliminó correctamente.', 'No se pudo eliminar la asignación.')}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            )) : <EmptyState title="Sin asignaciones" description="Todavía no hay agentes conectados a estaciones dentro del plano." />}
          </div>
          </div>
        </SectionCard>

        <SectionCard title="Registro operativo" subtitle="El resto de la señal queda agrupado en un único bloque analítico sobrio: tareas, ejecuciones, aprobaciones y consistencia.">
          <div className="grid gap-5 xl:grid-cols-3">
            <div className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Tareas vivas</p>
            {state.recentTasks.length === 0 ? <EmptyState title="Sin movimiento reciente" description="Todavía no hay tareas recientes enlazadas al pulso de la oficina." /> : state.recentTasks.map((task) => (
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
            ))}
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Ejecuciones y aprobaciones</p>
              {state.activeRuns.length > 0 ? state.activeRuns.slice(0, 3).map((run) => (
              <div key={run.id} className="surface-muted p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{run.requested_action}</p>
                    <p className="mt-1 text-sm text-zinc-400">Modo {formatDisplayText(run.execution_mode)} · traza {run.trace_id.slice(0, 8)}</p>
                  </div>
                  <StatusBadge status={run.status} />
                </div>
              </div>
            )) : <p className="text-sm text-zinc-500">No hay ejecuciones activas ahora mismo.</p>}

              {state.pendingApprovals.slice(0, 3).map((approval) => (
              <div key={approval.id} className="surface-muted p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{formatDisplayText(approval.approval_type)}</p>
                    <p className="mt-1 text-sm text-zinc-400">Solicitado por {approval.requested_by}</p>
                    <p className="mt-2 text-xs text-zinc-500">{approval.reason}</p>
                  </div>
                  <StatusBadge status={approval.status} />
                </div>
              </div>
            ))}
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Riesgos y consistencia</p>
              {state.warnings.length > 0 ? state.warnings.map((warning) => (
                <div key={`${warning.code}-${warning.entityId ?? 'global'}`} className="surface-muted p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">{warning.title}</p>
                      <p className="mt-1 text-sm leading-6 text-zinc-400">{warning.description}</p>
                    </div>
                    <StatusBadge status={warning.level} />
                  </div>
                </div>
              )) : <EmptyState title="Sin inconsistencias detectadas" description="No se detectan conflictos entre zonas, estaciones y asignaciones persistidas." />}
            </div>
          </div>
        </SectionCard>
      </div>

      <Modal open={zoneModalOpen} onOpenChange={(open) => { if (!open) resetZoneForm(); else setZoneModalOpen(true); }} title={editingZoneId ? 'Editar zona' : 'Crear zona'} description="Define sala, superficie y acento visual persistente.">
        <form className="space-y-4" onSubmit={submitZone}>
          <FormField label="Código"><Input value={zoneForm.code} onChange={(event) => setZoneForm((current) => ({ ...current, code: event.target.value }))} /></FormField>
          <FormField label="Nombre"><Input value={zoneForm.name} onChange={(event) => setZoneForm((current) => ({ ...current, name: event.target.value }))} /></FormField>
          <FormField label="Subtítulo"><Input value={zoneForm.subtitle} onChange={(event) => setZoneForm((current) => ({ ...current, subtitle: event.target.value }))} /></FormField>
          <FormField label="Tipo">
            <select className="panel-input" value={zoneForm.zoneType} onChange={(event) => setZoneForm((current) => ({ ...current, zoneType: event.target.value }))}>
              <option value="control">control</option>
              <option value="delivery">entrega</option>
              <option value="review">revisión</option>
              <option value="integration">integración</option>
              <option value="focus">enfoque</option>
              <option value="observability">observabilidad</option>
            </select>
          </FormField>
          <FormField label="Acento"><Input value={zoneForm.accent} onChange={(event) => setZoneForm((current) => ({ ...current, accent: event.target.value }))} /></FormField>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Grid X"><Input type="number" value={zoneForm.gridX} onChange={(event) => setZoneForm((current) => ({ ...current, gridX: Number(event.target.value) }))} /></FormField>
            <FormField label="Grid Y"><Input type="number" value={zoneForm.gridY} onChange={(event) => setZoneForm((current) => ({ ...current, gridY: Number(event.target.value) }))} /></FormField>
            <FormField label="Ancho"><Input type="number" value={zoneForm.gridW} onChange={(event) => setZoneForm((current) => ({ ...current, gridW: Number(event.target.value) }))} /></FormField>
            <FormField label="Alto"><Input type="number" value={zoneForm.gridH} onChange={(event) => setZoneForm((current) => ({ ...current, gridH: Number(event.target.value) }))} /></FormField>
          </div>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : editingZoneId ? 'Guardar cambios' : 'Crear zona'}</Button>
        </form>
      </Modal>

      <Modal open={stationModalOpen} onOpenChange={(open) => { if (!open) resetStationForm(); else setStationModalOpen(true); }} title={editingStationId ? 'Editar estación' : 'Crear estación'} description="Administra puestos persistentes dentro de cada zona.">
        <form className="space-y-4" onSubmit={submitStation}>
          <FormField label="Zona">
            <select className="panel-input" value={stationForm.zoneId} onChange={(event) => setStationForm((current) => ({ ...current, zoneId: event.target.value }))}>
              {state.zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}</option>)}
            </select>
          </FormField>
          <FormField label="Código"><Input value={stationForm.code} onChange={(event) => setStationForm((current) => ({ ...current, code: event.target.value }))} /></FormField>
          <FormField label="Nombre"><Input value={stationForm.name} onChange={(event) => setStationForm((current) => ({ ...current, name: event.target.value }))} /></FormField>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Tipo">
              <select className="panel-input" value={stationForm.stationType} onChange={(event) => setStationForm((current) => ({ ...current, stationType: event.target.value }))}>
                <option value="desk">escritorio</option>
                <option value="table">mesa</option>
                <option value="booth">cabina</option>
                <option value="console">consola</option>
                <option value="gateway">gateway</option>
              </select>
            </FormField>
            <FormField label="Estado">
              <select className="panel-input" value={stationForm.status} onChange={(event) => setStationForm((current) => ({ ...current, status: event.target.value }))}>
                <option value="available">disponible</option>
                <option value="occupied">ocupada</option>
                <option value="reserved">reservada</option>
                <option value="maintenance">mantenimiento</option>
              </select>
            </FormField>
          </div>
          <FormField label="Capacidad"><Input type="number" min={1} max={20} value={stationForm.capacity} onChange={(event) => setStationForm((current) => ({ ...current, capacity: Number(event.target.value) }))} /></FormField>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : editingStationId ? 'Guardar cambios' : 'Crear estación'}</Button>
        </form>
      </Modal>

      <Modal open={assignmentModalOpen} onOpenChange={(open) => { if (!open) resetAssignmentForm(); else setAssignmentModalOpen(true); }} title={editingAssignmentId ? 'Editar asignación' : 'Crear asignación'} description="Conecta agente, estación y tarea sin romper consistencia operativa.">
        <form className="space-y-4" onSubmit={submitAssignment}>
          <FormField label="Estación">
            <select className="panel-input" value={assignmentForm.stationId} onChange={(event) => setAssignmentForm((current) => ({ ...current, stationId: event.target.value }))}>
              {allStations.map((station) => <option key={station.id} value={station.id}>{station.zoneName} · {station.name}</option>)}
            </select>
          </FormField>
          <FormField label="Agente">
            <select className="panel-input" value={assignmentForm.agentId} onChange={(event) => setAssignmentForm((current) => ({ ...current, agentId: event.target.value }))}>
              {agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
            </select>
          </FormField>
          <FormField label="Tarea vinculada">
            <select className="panel-input" value={assignmentForm.taskId} onChange={(event) => setAssignmentForm((current) => ({ ...current, taskId: event.target.value }))}>
              <option value="">Sin tarea vinculada</option>
              {tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
            </select>
          </FormField>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Rol"><Input value={assignmentForm.assignmentRole} onChange={(event) => setAssignmentForm((current) => ({ ...current, assignmentRole: event.target.value }))} /></FormField>
            <FormField label="Presencia">
              <select className="panel-input" value={assignmentForm.presenceStatus} onChange={(event) => setAssignmentForm((current) => ({ ...current, presenceStatus: event.target.value }))}>
                <option value="present">presente</option>
                <option value="focusing">en foco</option>
                <option value="in_review">en revisión</option>
                <option value="away">ausente</option>
              </select>
            </FormField>
          </div>
          <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-zinc-200">
            <input type="checkbox" checked={assignmentForm.isPrimary} onChange={(event) => setAssignmentForm((current) => ({ ...current, isPrimary: event.target.checked }))} />
            Asignación primaria
          </label>
          <FormField label="Notas"><Input value={assignmentForm.notes} onChange={(event) => setAssignmentForm((current) => ({ ...current, notes: event.target.value }))} /></FormField>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : editingAssignmentId ? 'Guardar cambios' : 'Crear asignación'}</Button>
        </form>
      </Modal>
    </PageShell>
  );
}
