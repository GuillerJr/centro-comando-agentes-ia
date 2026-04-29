import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { commandCenterApi } from '../api/commandCenterApi';
import { Button } from '../components/button';
import { DataTable, DetailList, EmptyState, ErrorState, formatDateTime, formatDisplayText, formatDuration, LoadingState, PageShell, RunLogViewer, SectionCard, StatsGrid, StatusBadge, TaskStatusTimeline } from '../components/ui';
import type { Task, TaskRun } from '../types/domain';

export function TaskDetailPage() {
  const { taskId } = useParams();
  const [task, setTask] = useState<Task | null>(null);
  const [runs, setRuns] = useState<TaskRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (error) return <ErrorState message={error} action={taskId ? <Button onClick={() => void loadTaskDetail(taskId)}>Reintentar</Button> : undefined} />;
  if (isLoading) return <LoadingState label="Cargando detalle de tarea..." />;
  if (!task) return <EmptyState title="Sin tarea disponible" description="No se encontró información suficiente para mostrar este detalle operativo." />;

  const requestedAction = String(task.metadata?.requestedAction ?? 'Sin acción declarada');

  return (
    <PageShell title={task.title} description={task.description}>
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
            <DetailList items={[{ label: 'Estado actual', value: formatDisplayText(task.status) }, { label: 'Acción solicitada', value: requestedAction }, { label: 'Creación', value: formatDateTime(task.created_at) }, { label: 'Inicio', value: formatDateTime(task.started_at) }, { label: 'Cierre', value: formatDateTime(task.completed_at) }]} />
          </SectionCard>
        </div>

        <div className="space-y-5">
          <RunLogViewer logs={task.logs ?? 'Sin logs registrados todavía.'} />
          <SectionCard title="Resultado actual" subtitle="Estado visible del resumen retornado por la tarea.">
            <div className="surface-muted p-4 text-sm leading-6 text-zinc-300">{task.result_summary ?? 'La tarea todavía no publicó un resultado resumido.'}</div>
          </SectionCard>
          <SectionCard title="Ejecuciones asociadas" subtitle="Registro asociado de ejecuciones disparadas desde esta tarea.">
            <DataTable
              columns={['Acción', 'Modo', 'Estado', 'Duración', 'Traza']}
              rows={runs.map((run) => [run.requested_action, formatDisplayText(run.execution_mode), <StatusBadge status={run.status} />, formatDuration(run.duration_ms), <span className="font-mono text-xs text-zinc-500">{run.trace_id}</span>])}
            />
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}
