import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { commandCenterApi } from '../api/commandCenterApi';
import { DataTable, ErrorState, formatDisplayText, LoadingState, PageShell, RunLogViewer, SectionCard, StatsGrid, StatusBadge, TaskStatusTimeline } from '../components/ui';
import type { Task, TaskRun } from '../types/domain';

export function TaskDetailPage() {
  const { taskId } = useParams();
  const [task, setTask] = useState<Task | null>(null);
  const [runs, setRuns] = useState<TaskRun[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId) return;
    Promise.all([commandCenterApi.getTask(taskId), commandCenterApi.getTaskRuns(taskId)])
      .then(([loadedTask, loadedRuns]) => {
        setTask(loadedTask);
        setRuns(loadedRuns);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'No se pudo cargar el detalle de la tarea.'));
  }, [taskId]);

  if (error) return <ErrorState message={error} />;
  if (!task) return <LoadingState label="Cargando detalle de tarea..." />;

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
            <div className="space-y-3">
              <div className="surface-muted p-4 text-sm leading-6 text-zinc-300">Estado actual: <span className="font-semibold text-white">{formatDisplayText(task.status)}</span>.</div>
              <div className="surface-muted p-4 text-sm leading-6 text-zinc-300">Inicio: <span className="font-semibold text-white">{task.started_at ?? 'pendiente'}</span>.</div>
              <div className="surface-muted p-4 text-sm leading-6 text-zinc-300">Cierre: <span className="font-semibold text-white">{task.completed_at ?? 'sin finalizar'}</span>.</div>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-5">
          <RunLogViewer logs={task.logs ?? 'Sin logs registrados todavía.'} />
          <SectionCard title="Ejecuciones asociadas" subtitle="Registro asociado de ejecuciones disparadas desde esta tarea.">
            <DataTable
              columns={['Acción', 'Modo', 'Estado', 'Traza']}
              rows={runs.map((run) => [run.requested_action, formatDisplayText(run.execution_mode), <StatusBadge status={run.status} />, <span className="font-mono text-xs text-zinc-500">{run.trace_id}</span>])}
            />
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}
