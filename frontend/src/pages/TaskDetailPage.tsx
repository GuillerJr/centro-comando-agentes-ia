import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { commandCenterApi } from '../api/commandCenterApi';
import { Button } from '../components/button';
import { ActionFeedback, DataTable, EmptyState, ErrorState, formatDateTime, formatDisplayText, formatDuration, LoadingState, PageShell, RunLogViewer, SectionCard, StatsGrid, StatusBadge, TaskStatusTimeline } from '../components/ui';
import type { Task, TaskRun } from '../types/domain';

export function TaskDetailPage() {
  const { taskId } = useParams();
  const [task, setTask] = useState<Task | null>(null);
  const [runs, setRuns] = useState<TaskRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadTaskDetail = async (currentTaskId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const [loadedTask, loadedRuns] = await Promise.all([commandCenterApi.getTask(currentTaskId), commandCenterApi.getTaskRuns(currentTaskId)]);
      setTask(loadedTask);
      setRuns(loadedRuns);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo cargar el detalle de la tarea.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!taskId) {
      setIsLoading(false);
      setError('No se indicó una tarea válida.');
      return;
    }

    void loadTaskDetail(taskId);
  }, [taskId]);

  if (error && !task) return <ErrorState message={error} action={taskId ? <Button onClick={() => void loadTaskDetail(taskId)}>Reintentar</Button> : undefined} />;
  if (isLoading) return <LoadingState label="Cargando detalle de tarea..." />;
  if (!task) return <EmptyState title="Sin tarea disponible" description="No se encontró información suficiente para mostrar este detalle operativo." />;

  const requestedAction = String(task.metadata?.requestedAction ?? 'Sin acción declarada');

  const refresh = async () => {
    if (!taskId) return;
    await loadTaskDetail(taskId);
  };

  const updateTaskLifecycle = async (nextStatus: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled') => {
    try {
      setIsSubmitting(true);
      setError(null);
      setFeedback(null);
      await commandCenterApi.updateTask(task.id, {
        title: task.title,
        description: task.description,
        priority: task.priority,
        taskType: task.task_type,
        leadSkillId: task.lead_skill_id ?? null,
        supportSkillIds: task.support_skill_ids,
        status: nextStatus,
        resultSummary: task.result_summary,
        logs: task.logs,
        createdBy: task.created_by,
        metadata: task.metadata ?? {},
        startedAt: nextStatus === 'running' ? new Date().toISOString() : task.started_at,
        completedAt: ['completed', 'failed', 'cancelled'].includes(nextStatus) ? new Date().toISOString() : null,
      });
      setFeedback(`La tarea ahora está en ${formatDisplayText(nextStatus)}.`);
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo actualizar la tarea.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const runTaskNow = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      setFeedback(null);
      await commandCenterApi.runTask(task.id, {
        actorName: 'Guiller',
        requestedAction,
        executionMode: 'cli',
        skillIds: task.support_skill_ids,
        agentId: null,
      });
      setFeedback('Se disparó una nueva ejecución para esta tarea.');
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo ejecutar la tarea.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell title={task.title} description={task.description} action={<div className="flex flex-wrap gap-2"><Button size="sm" variant="secondary" disabled={isSubmitting} onClick={() => void updateTaskLifecycle('running')}>Marcar running</Button><Button size="sm" variant="ghost" disabled={isSubmitting} onClick={() => void updateTaskLifecycle('completed')}>Completar</Button><Button size="sm" variant="ghost" disabled={isSubmitting} onClick={() => void updateTaskLifecycle('failed')}>Fallar</Button><Button size="sm" disabled={isSubmitting} onClick={() => void runTaskNow()}>Ejecutar</Button></div>}>
      {error ? <ActionFeedback tone="warning" message={error} /> : null}
      {feedback ? <ActionFeedback tone="success" message={feedback} /> : null}
      <StatsGrid
        className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
        items={[
          { eyebrow: 'Prioridad', title: formatDisplayText(task.priority), description: 'Nivel actual asignado a la tarea dentro del flujo operativo.', tone: 'default' },
          { eyebrow: 'Tipo', title: formatDisplayText(task.task_type), description: 'Dominio funcional principal asociado a esta ejecución.', tone: 'success' },
          { eyebrow: 'Ejecuciones', title: `${runs.length} asociadas`, description: 'Cantidad de corridas registradas para esta tarea.', tone: runs.length > 0 ? 'default' : 'warning' },
        ]}
      />

      <div className="grid gap-5 xl:grid-cols-[0.78fr_1.22fr]">
        <div className="space-y-5">
          <TaskStatusTimeline status={task.status} startedAt={task.started_at} completedAt={task.completed_at} />
          <SectionCard title="Contexto de ejecución" subtitle="Resumen para leer estado, tiempos y cantidad de corridas sin navegar a otra vista.">
            <DataTable columns={['Campo', 'Valor']} rows={[["Estado actual", <StatusBadge status={task.status} />],["Acción solicitada", requestedAction],["Creación", formatDateTime(task.created_at)],["Inicio", formatDateTime(task.started_at)],["Cierre", formatDateTime(task.completed_at)],["Creada por", task.created_by ?? 'sistema']]} />
          </SectionCard>
        </div>

        <div className="space-y-5">
          <RunLogViewer logs={task.logs ?? 'Sin logs registrados todavía.'} />
          <SectionCard title="Resultado actual" subtitle="Estado visible del resumen retornado por la tarea.">
            <div className="surface-muted p-4 text-sm leading-6 text-zinc-300">{task.result_summary ?? 'La tarea todavía no publicó un resultado resumido.'}</div>
          </SectionCard>
          <SectionCard title="Ejecuciones asociadas" subtitle="Registro asociado de ejecuciones disparadas desde esta tarea.">
            <DataTable
              columns={['Acción', 'Modo', 'Estado', 'Duración', 'Traza', 'Acciones']}
              rows={runs.map((run) => [run.requested_action, formatDisplayText(run.execution_mode), <StatusBadge status={run.status} />, formatDuration(run.duration_ms), <span className="font-mono text-xs text-zinc-500">{run.trace_id}</span>, <div className="flex flex-wrap gap-2">{run.status === 'running' ? <Button size="sm" variant="ghost" disabled={isSubmitting} onClick={() => void commandCenterApi.updateRunStatus(run.id, { status: 'cancelled', errorMessage: 'Cancelada desde detalle de tarea' }).then(refresh).catch((reason) => setError(reason instanceof Error ? reason.message : 'No se pudo cancelar el run.'))}>Cancelar</Button> : null}{run.status === 'failed' || run.status === 'cancelled' ? <Button size="sm" variant="secondary" disabled={isSubmitting} onClick={() => void commandCenterApi.updateRunStatus(run.id, { status: 'queued', errorMessage: null }).then(refresh).catch((reason) => setError(reason instanceof Error ? reason.message : 'No se pudo reencolar el run.'))}>Reintentar</Button> : null}</div>])}
            />
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}
