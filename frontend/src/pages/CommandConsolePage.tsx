import { useEffect, useState } from 'react';
import { commandCenterApi } from '../api/commandCenterApi';
import { CommandConsole, DataTable, EmptyState, ErrorState, formatDisplayText, LoadingState, MetricPill, PageShell, SectionCard, StatsGrid } from '../components/ui';
import type { ConsoleSnapshot } from '../types/domain';

export function CommandConsolePage() {
  const [snapshot, setSnapshot] = useState<ConsoleSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    commandCenterApi.getConsoleSnapshot().then(setSnapshot).catch((reason) => setError(reason instanceof Error ? reason.message : 'No se pudo cargar la consola operativa.'));
  }, []);

  if (error) return <ErrorState message={error} />;
  if (!snapshot) return <LoadingState label="Cargando consola de mando..." />;

  return (
    <PageShell title="Consola operativa" description="Superficie controlada para observar el runtime, la lista permitida y las señales operativas recientes." action={<MetricPill label="Modo" value={snapshot.mode} tone="info" />}>
      <StatsGrid
        className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
        items={[
          { eyebrow: 'Seguridad', title: `${snapshot.commandWhitelist.length} comandos permitidos`, description: 'La consola solo expone acciones explícitamente autorizadas por la capa adaptadora.', tone: 'warning' },
          { eyebrow: 'Agentes', title: `${snapshot.availableAgents.length} visibles`, description: snapshot.availableAgents.length > 0 ? snapshot.availableAgents.map((agent) => agent.name).join(' · ') : 'No hay agentes visibles en este corte.', tone: 'default' },
          { eyebrow: 'Señales', title: `${snapshot.logs.length} eventos recientes`, description: 'Eventos devueltos por el snapshot para seguir la actividad reciente del runtime.', tone: 'success' },
        ]}
      />

      <div className="grid gap-5 xl:grid-cols-[1.18fr_0.82fr]">
        <SectionCard title="Comandos permitidos" subtitle="Comandos explícitamente permitidos por la capa adaptadora.">
          <CommandConsole>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {snapshot.commandWhitelist.map((command) => (
                <div key={command} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4 text-sm font-medium text-zinc-200 break-all sm:break-normal">
                  {formatDisplayText(command)}
                </div>
              ))}
            </div>
          </CommandConsole>
        </SectionCard>

        <EmptyState title="Consola de observación" description="Este módulo prioriza seguridad: muestra contexto operativo, pero no permite lanzar comandos arbitrarios desde la interfaz." />
      </div>

      <SectionCard title="Registros recientes" subtitle="Eventos recientes expuestos por el estado actual.">
        {snapshot.logs.length === 0 ? (
          <EmptyState title="Sin logs disponibles" description="No se recibieron eventos recientes desde la capa de consola." />
        ) : (
          <DataTable
            columns={['Nivel', 'Fecha', 'Mensaje']}
            rows={snapshot.logs.map((log, index) => [formatDisplayText(log.level), log.timestamp, <div key={`${log.timestamp}-${index}`} className="max-w-3xl text-sm leading-6 text-zinc-400">{log.message}</div>])}
          />
        )}
      </SectionCard>
    </PageShell>
  );
}
