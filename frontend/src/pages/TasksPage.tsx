import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { commandCenterApi } from '../api/commandCenterApi';
import { Button } from '../components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/card';
import { Input } from '../components/input';
import { ConfirmDialog, DataTable, ErrorState, InfoPanel, LoadingState, PageShell, SectionCard, StatusBadge } from '../components/ui';
import type { Task } from '../types/domain';
import { taskFormSchema } from '../utils/validation';

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', taskType: 'fullstack', requestedAction: '' });
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

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
  };

  const cancelTask = async (taskId: string) => {
    await commandCenterApi.cancelTask(taskId);
    await loadTasks();
  };

  if (error) return <ErrorState message={error} />;
  if (!tasks) return <LoadingState label="Cargando tareas..." />;

  return (
    <PageShell title="Tasks" description="Planeación, ejecución y seguimiento de trabajo operativo sobre OpenClaw y la capa de gobierno superior." action={<ConfirmDialog title="Control de seguridad" description="Acciones sensibles deben pasar por aprobaciones antes de ejecutarse." />}>
      <div className="grid gap-6 xl:grid-cols-[0.84fr_1.16fr]">
        <Card>
          <CardHeader>
            <CardTitle>{editingTaskId ? 'Edit task' : 'Create task'}</CardTitle>
            <CardDescription>Define prioridad, tipo y acción con claridad antes de disparar ejecución.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input placeholder="Title" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
              <textarea className="panel-input min-h-[120px]" placeholder="Description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
              <div className="grid gap-4 md:grid-cols-2">
                <select className="panel-input" value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}>
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                  <option value="critical">critical</option>
                </select>
                <select className="panel-input" value={form.taskType} onChange={(event) => setForm((current) => ({ ...current, taskType: event.target.value }))}>
                  <option value="frontend">frontend</option>
                  <option value="backend">backend</option>
                  <option value="database">database</option>
                  <option value="mcp">mcp</option>
                  <option value="fullstack">fullstack</option>
                  <option value="infrastructure">infrastructure</option>
                  <option value="documentation">documentation</option>
                </select>
              </div>
              <textarea className="panel-input min-h-[110px]" placeholder="Requested action" value={form.requestedAction} onChange={(event) => setForm((current) => ({ ...current, requestedAction: event.target.value }))} />
              <div className="flex flex-wrap gap-3">
                <Button type="submit">{editingTaskId ? 'Save task' : 'Create and run'}</Button>
                {editingTaskId ? <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button> : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <InfoPanel eyebrow="Running" title={`${tasks.filter((task) => task.status === 'running').length} active`} description="Tareas actualmente en curso y con seguimiento operativo." tone="success" />
            <InfoPanel eyebrow="Pending" title={`${tasks.filter((task) => task.status === 'pending').length}`} description="Trabajo listo para ejecutar o revisar antes de correr." tone="default" />
            <InfoPanel eyebrow="Completed" title={`${tasks.filter((task) => task.status === 'completed').length}`} description="Historial reciente de tareas concluidas correctamente." tone="default" />
          </div>

          <SectionCard title="Task queue" subtitle="Vista principal de tareas con acceso rápido a detalle y acciones operativas.">
            <DataTable
              columns={['Title', 'Priority', 'Type', 'Status', 'Detail', 'Actions']}
              rows={tasks.map((task) => [
                <div className="max-w-xs text-sm font-semibold text-slate-800">{task.title}</div>,
                task.priority,
                task.task_type,
                <StatusBadge status={task.status} />,
                <Link className="text-blue-600 hover:text-blue-700" to={`/tasks/${task.id}`}>View detail</Link>,
                <div className="flex flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={() => startEdit(task)}>Edit</Button><Button size="sm" variant="danger" onClick={() => void cancelTask(task.id)}>Cancel</Button></div>,
              ])}
            />
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}
