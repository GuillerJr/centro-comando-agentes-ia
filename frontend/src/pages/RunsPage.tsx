import { useEffect, useState } from 'react';
import { commandCenterApi } from '../api/commandCenterApi';
import { DataTable, ErrorState, formatDisplayText, LoadingState, PageShell, SectionCard, StatsGrid, StatusBadge } from '../components/ui';
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
    <PageShell title="Ejecuciones" description="Seguimiento de cada ejecución asociada a tareas, agentes, runtime y resultados operativos.">
      <StatsGrid
        className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
        items={[
          { eyebrow: 'Ejecuciones', title: `${runs.length} registradas`, description: 'Historial actual de ejecuciones persistidas por el sistema.', tone: 'default' },
          { eyebrow: 'Completadas', title: `${runs.filter((run) => run.status === 'completed').length}`, description: 'Ejecuciones finalizadas satisfactoriamente.', tone: 'success' },
          { eyebrow: 'En curso o fallidas', title: `${runs.filter((run) => run.status === 'running' || run.status === 'failed').length}`, description: 'Elementos que requieren seguimiento inmediato o revisión.', tone: 'warning' },
          { eyebrow: 'Duración media', title: `${Math.round(runs.filter((run) => run.duration_ms).reduce((total, run) => total + (run.duration_ms ?? 0), 0) / Math.max(1, runs.filter((run) => run.duration_ms).length))} ms`, description: 'Referencia rápida para detectar desvíos de desempeño entre ejecuciones.', tone: 'default' },
        ]}
      />

      <SectionCard title="Registro de ejecuciones" subtitle="Vista compacta y trazable de runs, duración, salida y modo de operación.">
        <DataTable
          columns={['Traza', 'Tarea', 'Modo', 'Estado', 'Duración', 'Salida']}
          rows={runs.map((run) => [
            <span className="font-mono text-xs text-zinc-500">{run.trace_id}</span>,
            <span className="text-sm text-zinc-300">{run.task_id}</span>,
            <span className="text-sm text-zinc-300">{formatDisplayText(run.execution_mode)}</span>,
            <StatusBadge status={run.status} />,
            run.duration_ms ? `${run.duration_ms} ms` : 'no disponible',
            <div className="max-w-[16rem] text-sm leading-6 text-zinc-400">{run.output_summary ?? 'Sin salida'}</div>,
          ])}
        />
      </SectionCard>
    </PageShell>
  );
}
