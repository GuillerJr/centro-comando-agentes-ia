import { useEffect, useState } from 'react';
import { commandCenterApi } from '../api/commandCenterApi';
import { Button } from '../components/button';
import { DataTable, DetailList, EmptyState, ErrorState, formatDateTime, formatDisplayText, formatDuration, LoadingState, PageShell, SectionCard, StatsGrid, StatusBadge } from '../components/ui';
import type { TaskRun } from '../types/domain';

export function RunsPage() {
  const [runs, setRuns] = useState<TaskRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRuns = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setRuns(await commandCenterApi.getTaskRunsAll());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudieron cargar las ejecuciones.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRuns();
  }, []);

  if (error) return <ErrorState message={error} action={<Button onClick={() => void loadRuns()}>Reintentar</Button>} />;
  if (isLoading) return <LoadingState label="Cargando ejecuciones..." />;

  const lastRun = runs[0];

  return (
    <PageShell title="Ejecuciones" description="Seguimiento de cada ejecución asociada a tareas, agentes, runtime y resultados operativos.">
      <StatsGrid
        className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
        items={[
          { eyebrow: 'Ejecuciones', title: `${runs.length} registradas`, description: 'Historial actual de ejecuciones persistidas por el sistema.', tone: 'default' },
          { eyebrow: 'Completadas', title: `${runs.filter((run) => run.status === 'completed').length}`, description: 'Ejecuciones finalizadas satisfactoriamente.', tone: 'success' },
          { eyebrow: 'En curso o fallidas', title: `${runs.filter((run) => run.status === 'running' || run.status === 'failed').length}`, description: 'Elementos que requieren seguimiento inmediato o revisión.', tone: 'warning' },
          { eyebrow: 'Duración media', title: formatDuration(Math.round(runs.filter((run) => run.duration_ms).reduce((total, run) => total + (run.duration_ms ?? 0), 0) / Math.max(1, runs.filter((run) => run.duration_ms).length))), description: 'Referencia rápida para detectar desvíos de desempeño entre ejecuciones.', tone: 'default' },
        ]}
      />

      <div className="grid gap-5 xl:grid-cols-[1.16fr_0.84fr]">
        <SectionCard title="Registro de ejecuciones" subtitle="Vista compacta y trazable de runs, duración, salida y modo de operación.">
          <DataTable
            columns={['Traza', 'Tarea', 'Modo', 'Estado', 'Duración', 'Salida']}
            rows={runs.map((run) => [
              <span className="font-mono text-xs text-zinc-500">{run.trace_id}</span>,
              <span className="text-sm text-zinc-300">{run.task_id}</span>,
              <span className="text-sm text-zinc-300">{formatDisplayText(run.execution_mode)}</span>,
              <StatusBadge status={run.status} />,
              formatDuration(run.duration_ms),
              <div className="max-w-[16rem] text-sm leading-6 text-zinc-400">{run.output_summary ?? 'Sin salida'}</div>,
            ])}
          />
        </SectionCard>

        <SectionCard title="Última ejecución visible" subtitle="Ficha rápida para revisar el corte más reciente sin salir de esta vista.">
          {lastRun ? (
            <DetailList
              items={[
                { label: 'Traza', value: <span className="font-mono text-xs text-zinc-300">{lastRun.trace_id}</span> },
                { label: 'Estado', value: <StatusBadge status={lastRun.status} /> },
                { label: 'Modo', value: formatDisplayText(lastRun.execution_mode) },
                { label: 'Fecha', value: formatDateTime(lastRun.executed_at) },
                { label: 'Duración', value: formatDuration(lastRun.duration_ms) },
                { label: 'Error', value: lastRun.error_message ?? 'Sin error reportado' },
              ]}
            />
          ) : <EmptyState title="Sin ejecuciones visibles" description="Aún no hay corridas registradas para construir esta ficha rápida." />}
        </SectionCard>
      </div>
    </PageShell>
  );
}
