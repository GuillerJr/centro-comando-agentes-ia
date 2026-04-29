import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { commandCenterApi } from '../api/commandCenterApi';
import { Button } from '../components/button';
import { Input } from '../components/input';
import { Modal } from '../components/modal';
import { CreateButton, IconCancelButton, IconEditButton } from '../components/table-actions';
import { ActionFeedback, ConfirmDialog, DataTable, ErrorState, FormField, formatDisplayText, LoadingState, PageShell, SectionCard, StatsGrid, StatusBadge } from '../components/ui';
import type { Task } from '../types/domain';
import { taskFormSchema } from '../utils/validation';

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', taskType: 'fullstack', requestedAction: '' });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      setTasks(await commandCenterApi.getTasks());
    } catch (reason) {
      setLoadError(reason instanceof Error ? reason.message : 'No se pudieron cargar las tareas.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void loadTasks(); }, []);

  const resetForm = () => {
    setForm({ title: '', description: '', priority: 'medium', taskType: 'fullstack', requestedAction: '' });
    setEditingTask(null);
    setEditingTaskId(null);
    setIsModalOpen(false);
    setActionError(null);
  };

  const openCreate = () => {
    setFeedback(null);
    setActionError(null);
    setEditingTask(null);
    setEditingTaskId(null);
    setForm({ title: '', description: '', priority: 'medium', taskType: 'fullstack', requestedAction: '' });
    setIsModalOpen(true);
  };

  const handleModalChange = (open: boolean) => {
    if (!open) {
      resetForm();
      return;
    }

    setIsModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);
    const parsed = taskFormSchema.safeParse(form);
    if (!parsed.success) {
      setActionError(parsed.error.issues[0]?.message ?? 'Formulario inválido.');
      return;
    }
    try {
      setIsSubmitting(true);
      setActionError(null);
      if (editingTaskId) {
        await commandCenterApi.updateTask(editingTaskId, {
          title: parsed.data.title,
          description: parsed.data.description,
          priority: parsed.data.priority,
          taskType: parsed.data.taskType,
          leadSkillId: editingTask?.lead_skill_id ?? null,
          supportSkillIds: editingTask?.support_skill_ids ?? [],
          status: editingTask?.status ?? 'pending',
          resultSummary: editingTask?.result_summary ?? null,
          logs: editingTask?.logs ?? null,
          createdBy: editingTask?.created_by ?? 'operator',
          metadata: { ...(editingTask?.metadata ?? {}), requestedAction: parsed.data.requestedAction },
          startedAt: editingTask?.started_at ?? null,
          completedAt: editingTask?.completed_at ?? null,
        });
        setFeedback('La tarea se actualizó sin perder su contexto operativo.');
      } else {
        const createdTask = await commandCenterApi.createTask({ title: parsed.data.title, description: parsed.data.description, priority: parsed.data.priority, taskType: parsed.data.taskType, leadSkillId: null, supportSkillIds: [], status: 'pending', resultSummary: null, logs: null, createdBy: 'Guiller', metadata: { requestedAction: parsed.data.requestedAction } });
        await commandCenterApi.runTask(createdTask.id, { requestedAction: parsed.data.requestedAction, skillIds: [], executionMode: 'mock' });
        setFeedback('La tarea se creó y se envió a ejecución.');
      }
      resetForm();
      await loadTasks();
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : 'No se pudo guardar la tarea.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (task: Task) => {
    setFeedback(null);
    setActionError(null);
    setEditingTask(task);
    setEditingTaskId(task.id);
    setForm({
      title: task.title,
      description: task.description,
      priority: task.priority,
      taskType: task.task_type,
      requestedAction: String(task.metadata?.requestedAction ?? ''),
    });
    setIsModalOpen(true);
  };

  const cancelTask = async (taskId: string) => {
    try {
      setActionError(null);
      setFeedback(null);
      await commandCenterApi.cancelTask(taskId);
      setFeedback('La tarea se canceló correctamente.');
      await loadTasks();
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : 'No se pudo cancelar la tarea.');
    }
  };

  const updateTaskStatus = async (task: Task, status: string) => {
    try {
      setActionError(null);
      setFeedback(null);
      await commandCenterApi.updateTask(task.id, {
        title: task.title,
        description: task.description,
        priority: task.priority,
        taskType: task.task_type,
        leadSkillId: task.lead_skill_id ?? null,
        supportSkillIds: task.support_skill_ids,
        status,
        resultSummary: task.result_summary,
        logs: task.logs,
        createdBy: task.created_by ?? 'operator',
        metadata: task.metadata ?? {},
        startedAt: status === 'running' ? new Date().toISOString() : task.started_at ?? null,
        completedAt: ['completed', 'failed', 'cancelled'].includes(status) ? new Date().toISOString() : null,
      });
      setFeedback(`La tarea ahora está en ${formatDisplayText(status)}.`);
      await loadTasks();
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : 'No se pudo actualizar el estado de la tarea.');
    }
  };

  const rerunTask = async (task: Task) => {
    try {
      setActionError(null);
      setFeedback(null);
      await commandCenterApi.runTask(task.id, { requestedAction: String(task.metadata?.requestedAction ?? task.title), skillIds: task.support_skill_ids, executionMode: 'cli' });
      setFeedback('La tarea se volvió a ejecutar.');
      await loadTasks();
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : 'No se pudo volver a ejecutar la tarea.');
    }
  };

  if (loadError) return <ErrorState message={loadError} action={<Button onClick={() => void loadTasks()}>Reintentar</Button>} />;
  if (isLoading) return <LoadingState label="Cargando tareas..." />;

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = `${task.title} ${task.description} ${task.task_type}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <PageShell title="Tareas" description="Planeación, ejecución y seguimiento de trabajo operativo sobre OpenClaw y la capa de gobierno superior." action={<ConfirmDialog title="Control de seguridad" description="Acciones sensibles deben pasar por aprobaciones antes de ejecutarse." />}>
      {!isModalOpen && actionError ? <ActionFeedback tone="warning" message={actionError} /> : null}
      {feedback ? <ActionFeedback tone="success" message={feedback} /> : null}
      <StatsGrid
        className="grid gap-5 md:grid-cols-2 xl:grid-cols-4"
        items={[
          { eyebrow: 'En curso', title: `${tasks.filter((task) => task.status === 'running').length} activas`, description: 'Tareas actualmente en curso y con seguimiento operativo.', tone: 'success' },
          { eyebrow: 'Pendientes', title: `${tasks.filter((task) => task.status === 'pending').length}`, description: 'Trabajo listo para ejecutar o revisar antes de correr.', tone: 'default' },
          { eyebrow: 'Completadas', title: `${tasks.filter((task) => task.status === 'completed').length}`, description: 'Historial reciente de tareas concluidas correctamente.', tone: 'default' },
          { eyebrow: 'Críticas', title: `${tasks.filter((task) => task.priority === 'critical' || task.priority === 'high').length} prioritarias`, description: 'Carga que conviene atender antes de abrir nuevos frentes secundarios.', tone: 'warning' },
        ]}
      />

      <SectionCard title="Lectura de la cola" subtitle="Resumen operativo más compacto y accionable del backlog actual.">
        <DataTable
          columns={['Indicador', 'Valor', 'Lectura']}
          rows={[
            ['Esperando aprobación', tasks.filter((task) => task.status === 'awaiting_approval').length, 'Tareas detenidas por control humano previo.'],
            ['Canceladas', tasks.filter((task) => task.status === 'cancelled').length, 'Trabajo descartado o detenido de forma explícita.'],
            ['Carga alta', tasks.filter((task) => task.priority === 'high' || task.priority === 'critical').length, 'Tareas que conviene atender primero.'],
          ]}
        />
      </SectionCard>

      <SectionCard title="Cola de tareas" subtitle="Gestión centralizada con tabla, acciones compactas y modales." action={<CreateButton label="Crear tarea" onClick={openCreate} />}>
        <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
          <Input placeholder="Buscar tarea..." value={search} onChange={(event) => setSearch(event.target.value)} />
          <select className="panel-input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">todos los estados</option><option value="pending">pendientes</option><option value="running">running</option><option value="awaiting_approval">esperando aprobación</option><option value="completed">completadas</option><option value="failed">fallidas</option><option value="cancelled">canceladas</option></select>
        </div>
        <DataTable
          columns={['Título', 'Prioridad', 'Tipo', 'Estado', 'Detalle', 'Acciones']}
          rows={filteredTasks.map((task) => [
            <div className="max-w-xs"><p className="text-sm font-semibold text-white">{task.title}</p><p className="mt-1 text-xs text-zinc-500">{task.result_summary ?? 'Sin resumen todavía'}</p></div>,
            <span className="text-sm text-zinc-300">{formatDisplayText(task.priority)}</span>,
            <span className="text-sm text-zinc-300">{formatDisplayText(task.task_type)}</span>,
            <StatusBadge status={task.status} />,
            <Link className="text-blue-300 hover:text-blue-200" to={`/tasks/${task.id}`}>Ver detalle</Link>,
            <div className="flex flex-wrap gap-2"><IconEditButton onClick={() => startEdit(task)} />{task.status !== 'running' && task.status !== 'completed' ? <Button size="sm" variant="secondary" onClick={() => void updateTaskStatus(task, 'running')}>Run</Button> : null}{task.status === 'running' ? <Button size="sm" variant="ghost" onClick={() => void updateTaskStatus(task, 'completed')}>Completar</Button> : null}{task.status === 'failed' || task.status === 'cancelled' ? <Button size="sm" variant="secondary" onClick={() => void rerunTask(task)}>Reintentar</Button> : null}{task.status !== 'cancelled' ? <IconCancelButton onClick={() => void cancelTask(task.id)} /> : null}</div>,
          ])}
        />
      </SectionCard>

      <Modal open={isModalOpen} onOpenChange={handleModalChange} title={editingTaskId ? 'Editar tarea' : 'Crear tarea'} description="Formulario compacto para alta o edición de tareas.">
        <form className="space-y-4" onSubmit={handleSubmit}>
          {actionError ? <ActionFeedback tone="warning" message={actionError} /> : null}
          <FormField label="Título"><Input placeholder="Título" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} /></FormField>
          <FormField label="Descripción"><textarea className="panel-input min-h-[120px]" placeholder="Descripción" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></FormField>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Prioridad"><select className="panel-input" value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}>
              <option value="low">baja</option>
              <option value="medium">media</option>
              <option value="high">alta</option>
              <option value="critical">crítica</option>
            </select></FormField>
            <FormField label="Tipo"><select className="panel-input" value={form.taskType} onChange={(event) => setForm((current) => ({ ...current, taskType: event.target.value }))}>
              <option value="frontend">frontend</option>
              <option value="backend">backend</option>
              <option value="database">base de datos</option>
              <option value="mcp">MCP</option>
              <option value="fullstack">full stack</option>
              <option value="infrastructure">infraestructura</option>
              <option value="documentation">documentación</option>
            </select></FormField>
          </div>
          <FormField label="Acción solicitada" helper="Texto exacto que se enviará al runtime o al adaptador."><textarea className="panel-input min-h-[110px]" placeholder="Acción solicitada" value={form.requestedAction} onChange={(event) => setForm((current) => ({ ...current, requestedAction: event.target.value }))} /></FormField>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : editingTaskId ? 'Guardar tarea' : 'Crear y ejecutar'}</Button>
            <Button type="button" variant="secondary" onClick={resetForm}>Cancelar</Button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
}
