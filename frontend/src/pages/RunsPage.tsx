import { useEffect, useState } from 'react';
import { commandCenterApi } from '../api/commandCenterApi';
import { DataTable, ErrorState, InfoPanel, LoadingState, PageShell, SectionCard, StatusBadge } from '../components/ui';
import type { TaskRun } from '../types/domain';

export function RunsPage() {
  const [runs, setRuns] = useState<TaskRun[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    commandCenterApi.getTaskRunsAll().then(setRuns).catch((reason) => setError(reason instanceof Error ? reason.message : 'No se pudieron cargar las ejecuciones.'));
  }, []);

  if (error) return <ErrorState message={error} />;
  if (!runs) return <LoadingState label="Cargando ejecuciones..." />;

  return (
    <PageShell title="Runs" description="Seguimiento de cada ejecución asociada a tareas, agentes, runtime y resultados operativos.">
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-3">
          <InfoPanel eyebrow="Runs" title={`${runs.length} registered`} description="Historial actual de ejecuciones persistidas por el sistema." tone="default" />
          <InfoPanel eyebrow="Completed" title={`${runs.filter((run) => run.status === 'completed').length}`} description="Ejecuciones finalizadas satisfactoriamente." tone="success" />
          <InfoPanel eyebrow="Active / failed" title={`${runs.filter((run) => run.status === 'running' || run.status === 'failed').length}`} description="Items que requieren seguimiento inmediato o revisión." tone="warning" />
        </div>

        <SectionCard title="Execution register" subtitle="Vista compacta y trazable de runs, duración, salida y modo de operación.">
          <DataTable
            columns={['Trace', 'Task', 'Mode', 'Status', 'Duration', 'Output']}
            rows={runs.map((run) => [
              <span className="font-mono text-xs text-slate-400">{run.trace_id}</span>,
              run.task_id,
              run.execution_mode,
              <StatusBadge status={run.status} />,
              run.duration_ms ? `${run.duration_ms} ms` : 'n/a',
              <div className="max-w-md text-sm leading-6 text-slate-600">{run.output_summary ?? 'Sin salida'}</div>,
            ])}
          />
        </SectionCard>
      </div>
    </PageShell>
  );
}
