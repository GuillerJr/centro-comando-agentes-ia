import { useEffect, useState } from 'react';
import { commandCenterApi } from '../api/commandCenterApi';
import { Button } from '../components/button';
import { Input } from '../components/input';
import { ActionFeedback, DataTable, EmptyState, ErrorState, formatDateTime, formatDisplayText, formatDuration, LoadingState, PageShell, SectionCard, StatsGrid, StatusBadge } from '../components/ui';
import { usePersistedFilters } from '../hooks/use-persisted-filters';
import type { Task, TaskRun } from '../types/domain';

export function RunsPage() {
  const [runs, setRuns] = useState<TaskRun[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const { filters, set } = usePersistedFilters({ storageKey: 'cc-filters-runs', initialState: { search: '', statusFilter: 'all' } });

  const loadRuns = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [runData, taskData] = await Promise.all([
        commandCenterApi.getTaskRunsAll(),
        commandCenterApi.getTasks(),
      ]);
      setRuns(runData);
      setTasks(taskData);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudieron cargar las ejecuciones.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRuns();
  }, []);

  const mutateRun = async (run: TaskRun, action: 'cancel' | 'retry') => {
    try {
      setIsSubmitting(true);
      setError(null);
      setFeedback(null);
      if (action === 'cancel') {
        await commandCenterApi.updateRunStatus(run.id, { status: 'cancelled', errorMessage: run.error_message ?? 'Cancelada manualmente desde la UI.' });
        setFeedback(`La ejecución ${run.trace_id.slice(0, 8)} se canceló correctamente.`);
      } else {
        await commandCenterApi.updateRunStatus(run.id, { status: 'queued', outputSummary: run.output_summary ?? null, errorMessage: null });
        setFeedback(`La ejecución ${run.trace_id.slice(0, 8)} se reencoló correctamente.`);
      }
      await loadRuns();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo actualizar la ejecución.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error && isLoading) return <ErrorState message={error} action={<Button onClick={() => void loadRuns()}>Reintentar</Button>} />;
  if (isLoading) return <LoadingState label="Cargando ejecuciones..." />;

  const taskIndex = new Map(tasks.map((task) => [task.id, task]));

  const filteredRuns = runs.filter((run) => {
    const matchesSearch = `${run.trace_id} ${run.task_id} ${run.requested_action}`.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = filters.statusFilter === 'all' || run.status === filters.statusFilter;
    return matchesSearch && matchesStatus;
  });
  const lastRun = filteredRuns[0] ?? runs[0];

  return (
    <PageShell title="Ejecuciones" description="Seguimiento y control operativo real sobre cada run persistido.">
      {error ? <ActionFeedback tone="warning" message={error} /> : null}
      {feedback ? <ActionFeedback tone="success" message={feedback} /> : null}
      <StatsGrid
        className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
        items={[
          { eyebrow: 'Ejecuciones', title: `${runs.length} registradas`, description: 'Historial actual de ejecuciones persistidas por el sistema.', tone: 'default' },
          { eyebrow: 'Completadas', title: `${runs.filter((run) => run.status === 'completed').length}`, description: 'Ejecuciones finalizadas satisfactoriamente.', tone: 'success' },
          { eyebrow: 'En curso o fallidas', title: `${runs.filter((run) => run.status === 'running' || run.status === 'failed').length}`, description: 'Elementos que requieren seguimiento inmediato o revisión.', tone: 'warning' },
          { eyebrow: 'Duración media', title: formatDuration(Math.round(runs.filter((run) => run.duration_ms).reduce((total, run) => total + (run.duration_ms ?? 0), 0) / Math.max(1, runs.filter((run) => run.duration_ms).length))), description: 'Referencia rápida para detectar desvíos de desempeño entre ejecuciones.', tone: 'default' },
        ]}
      />

      <div className="grid gap-5 xl:grid-cols-[1.18fr_0.82fr]">
        <SectionCard title="Registro de ejecuciones" subtitle="Control de estado, reintento y cancelación desde tabla.">
          <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
            <Input placeholder="Buscar run o traza..." value={filters.search} onChange={(event) => set('search', event.target.value)} />
            <select className="panel-input" value={filters.statusFilter} onChange={(event) => set('statusFilter', event.target.value)}><option value="all">todos los estados</option><option value="queued">queued</option><option value="running">running</option><option value="completed">completed</option><option value="failed">failed</option><option value="cancelled">cancelled</option></select>
          </div>
          <DataTable
            columns={['Traza', 'Tarea', 'Espacio', 'Modo', 'Estado', 'Duración', 'Fecha', 'Acciones']}
            rows={filteredRuns.map((run) => [
              <span className="font-mono text-xs text-zinc-500">{run.trace_id.slice(0, 12)}</span>,
              <span className="text-sm text-zinc-300">{run.task_id}</span>,
              <span className="text-sm text-zinc-300">{String(taskIndex.get(run.task_id)?.metadata?.workspaceName ?? 'Sin espacio')}</span>,
              <span className="text-sm text-zinc-300">{formatDisplayText(run.execution_mode)}</span>,
              <StatusBadge status={run.status} />,
              formatDuration(run.duration_ms),
              <span className="text-xs text-zinc-400">{formatDateTime(run.executed_at)}</span>,
              <div className="flex flex-wrap gap-2">{run.status === 'running' ? <Button size="sm" variant="ghost" disabled={isSubmitting} onClick={() => void mutateRun(run, 'cancel')}>Cancelar</Button> : null}{run.status === 'failed' || run.status === 'cancelled' ? <Button size="sm" variant="secondary" disabled={isSubmitting} onClick={() => void mutateRun(run, 'retry')}>Reintentar</Button> : null}</div>,
            ])}
          />
        </SectionCard>

        <SectionCard title="Última ejecución visible" subtitle="Resumen ejecutivo del corte más reciente.">
          {lastRun ? <DataTable
            columns={['Campo', 'Valor']}
            rows={[
              ['Traza', <span className="font-mono text-xs text-zinc-300">{lastRun.trace_id}</span>],
              ['Estado', <StatusBadge status={lastRun.status} />],
              ['Espacio', String(taskIndex.get(lastRun.task_id)?.metadata?.workspaceName ?? 'Sin espacio')],
              ['Modo', formatDisplayText(lastRun.execution_mode)],
              ['Fecha', formatDateTime(lastRun.executed_at)],
              ['Duración', formatDuration(lastRun.duration_ms)],
              ['Salida', <div className="text-sm leading-6 text-zinc-400">{lastRun.output_summary ?? 'Sin salida reportada'}</div>],
              ['Error', <div className="text-sm leading-6 text-zinc-400">{lastRun.error_message ?? 'Sin error reportado'}</div>],
            ]}
          /> : <EmptyState title="Sin ejecuciones visibles" description="Aún no hay corridas registradas para construir este resumen." />}
        </SectionCard>
      </div>
    </PageShell>
  );
}
