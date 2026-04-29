import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { commandCenterApi } from '../api/commandCenterApi';
import { Button } from '../components/button';
import { Input } from '../components/input';
import { Modal } from '../components/modal';
import { CreateButton, IconEditButton } from '../components/table-actions';
import { ConfirmDialog, DataTable, ErrorState, formatDisplayText, LoadingState, PageShell, SectionCard, StatsGrid, StatusBadge } from '../components/ui';
import type { Task } from '../types/domain';
import { taskFormSchema } from '../utils/validation';

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', taskType: 'fullstack', requestedAction: '' });
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadTasks = async () => {
    try {
      setTasks(await commandCenterApi.getTasks());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudieron cargar las tareas.');
    }
  };

  useEffect(() => { void loadTasks(); }, []);

  const resetForm = () => {
    setForm({ title: '', description: '', priority: 'medium', taskType: 'fullstack', requestedAction: '' });
    setEditingTaskId(null);
    setIsModalOpen(false);
  };

  const openCreate = () => {
    setEditingTaskId(null);
    setForm({ title: '', description: '', priority: 'medium', taskType: 'fullstack', requestedAction: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = taskFormSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Formulario inválido.');
      return;
    }
    if (editingTaskId) {
      await commandCenterApi.updateTask(editingTaskId, { title: parsed.data.title, description: parsed.data.description, priority: parsed.data.priority, taskType: parsed.data.taskType, leadSkillId: null, supportSkillIds: [], status: 'pending', resultSummary: null, logs: null, createdBy: 'Guiller', metadata: { requestedAction: parsed.data.requestedAction }, startedAt: null, completedAt: null });
    } else {
      const createdTask = await commandCenterApi.createTask({ title: parsed.data.title, description: parsed.data.description, priority: parsed.data.priority, taskType: parsed.data.taskType, leadSkillId: null, supportSkillIds: [], status: 'pending', resultSummary: null, logs: null, createdBy: 'Guiller', metadata: { requestedAction: parsed.data.requestedAction } });
      await commandCenterApi.runTask(createdTask.id, { requestedAction: parsed.data.requestedAction, skillIds: [], executionMode: 'mock' });
    }
    resetForm();
    await loadTasks();
  };

  const startEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setForm({
      title: task.title,
      description: task.description,
      priority: task.priority,
      taskType: task.task_type,
      requestedAction: String((task as unknown as { metadata?: { requestedAction?: string } }).metadata?.requestedAction ?? ''),
    });
    setIsModalOpen(true);
  };

  const cancelTask = async (taskId: string) => {
    await commandCenterApi.cancelTask(taskId);
    await loadTasks();
  };

  if (error) return <ErrorState message={error} />;
  if (!tasks) return <LoadingState label="Cargando tareas..." />;

  return (
    <PageShell title="Tareas" description="Planeación, ejecución y seguimiento de trabajo operativo sobre OpenClaw y la capa de gobierno superior." action={<ConfirmDialog title="Control de seguridad" description="Acciones sensibles deben pasar por aprobaciones antes de ejecutarse." />}>
      <StatsGrid
        className="grid gap-5 md:grid-cols-2 xl:grid-cols-4"
        items={[
          { eyebrow: 'En curso', title: `${tasks.filter((task) => task.status === 'running').length} activas`, description: 'Tareas actualmente en curso y con seguimiento operativo.', tone: 'success' },
          { eyebrow: 'Pendientes', title: `${tasks.filter((task) => task.status === 'pending').length}`, description: 'Trabajo listo para ejecutar o revisar antes de correr.', tone: 'default' },
          { eyebrow: 'Completadas', title: `${tasks.filter((task) => task.status === 'completed').length}`, description: 'Historial reciente de tareas concluidas correctamente.', tone: 'default' },
          { eyebrow: 'Críticas', title: `${tasks.filter((task) => task.priority === 'critical' || task.priority === 'high').length} prioritarias`, description: 'Carga que conviene atender antes de abrir nuevos frentes secundarios.', tone: 'warning' },
        ]}
      />

      <SectionCard title="Cola de tareas" subtitle="Gestión centralizada con tabla, acciones compactas y modales." action={<CreateButton label="Crear tarea" onClick={openCreate} />}>
        <DataTable
          columns={['Título', 'Prioridad', 'Tipo', 'Estado', 'Detalle', 'Acciones']}
          rows={tasks.map((task) => [
            <div className="max-w-xs text-sm font-semibold text-white">{task.title}</div>,
            <span className="text-sm text-zinc-300">{formatDisplayText(task.priority)}</span>,
            <span className="text-sm text-zinc-300">{formatDisplayText(task.task_type)}</span>,
            <StatusBadge status={task.status} />,
            <Link className="text-blue-300 hover:text-blue-200" to={`/tasks/${task.id}`}>Ver detalle</Link>,
            <div className="flex flex-wrap gap-2"><IconEditButton onClick={() => startEdit(task)} /><Button size="icon" variant="danger" onClick={() => void cancelTask(task.id)} title="Cancelar">✕</Button></div>,
          ])}
        />
      </SectionCard>

      <Modal open={isModalOpen} onOpenChange={setIsModalOpen} title={editingTaskId ? 'Editar tarea' : 'Crear tarea'} description="Formulario compacto para alta o edición de tareas.">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input placeholder="Título" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
          <textarea className="panel-input min-h-[120px]" placeholder="Descripción" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
          <div className="grid gap-4 md:grid-cols-2">
            <select className="panel-input" value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}>
              <option value="low">baja</option>
              <option value="medium">media</option>
              <option value="high">alta</option>
              <option value="critical">crítica</option>
            </select>
            <select className="panel-input" value={form.taskType} onChange={(event) => setForm((current) => ({ ...current, taskType: event.target.value }))}>
              <option value="frontend">frontend</option>
              <option value="backend">backend</option>
              <option value="database">base de datos</option>
                <option value="mcp">MCP</option>
                <option value="fullstack">full stack</option>
              <option value="infrastructure">infraestructura</option>
              <option value="documentation">documentación</option>
            </select>
          </div>
          <textarea className="panel-input min-h-[110px]" placeholder="Acción solicitada" value={form.requestedAction} onChange={(event) => setForm((current) => ({ ...current, requestedAction: event.target.value }))} />
          <div className="flex flex-wrap gap-3">
            <Button type="submit">{editingTaskId ? 'Guardar tarea' : 'Crear y ejecutar'}</Button>
            <Button type="button" variant="secondary" onClick={resetForm}>Cancelar</Button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
}
