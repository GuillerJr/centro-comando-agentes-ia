import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { commandCenterApi } from '../api/commandCenterApi';
import { DataTable, ErrorState, InfoPanel, LoadingState, PageShell, RunLogViewer, SectionCard, StatusBadge, TaskStatusTimeline } from '../components/ui';
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
      <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
        <div className="space-y-6">
          <TaskStatusTimeline status={task.status} startedAt={task.started_at} completedAt={task.completed_at} />
          <InfoPanel eyebrow="Priority" title={task.priority} description="Prioridad actual asignada a esta tarea dentro del sistema operativo y de ejecución." tone="default" />
          <InfoPanel eyebrow="Type" title={task.task_type} description="Tipo funcional principal asociado a esta tarea y a su forma de orquestación." tone="success" />
        </div>

        <div className="space-y-6">
          <RunLogViewer logs={task.logs ?? 'Sin logs registrados todavía.'} />
          <SectionCard title="Associated runs" subtitle="Registro asociado de ejecuciones disparadas desde esta tarea.">
            <DataTable
              columns={['Action', 'Mode', 'Status', 'Trace']}
              rows={runs.map((run) => [run.requested_action, run.execution_mode, <StatusBadge status={run.status} />, <span className="font-mono text-xs text-slate-400">{run.trace_id}</span>])}
            />
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}
