import { useEffect, useState } from 'react';
import { commandCenterApi } from '../api/commandCenterApi';
import { CommandConsole, DataTable, EmptyState, ErrorState, InfoPanel, LoadingState, MetricPill, PageShell, SectionCard } from '../components/ui';
import type { ConsoleSnapshot } from '../types/domain';

export function CommandConsolePage() {
  const [snapshot, setSnapshot] = useState<ConsoleSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    commandCenterApi.getConsoleSnapshot().then(setSnapshot).catch((reason) => setError(reason instanceof Error ? reason.message : 'No se pudo cargar la consola.'));
  }, []);

  if (error) return <ErrorState message={error} />;
  if (!snapshot) return <LoadingState label="Cargando consola de mando..." />;

  return (
    <PageShell title="Command console" description="Vista operativa controlada del runtime, whitelist y snapshot reciente de actividad expuesta por la capa adaptadora." action={<MetricPill label="Mode" value={snapshot.mode} tone="info" />}>
      <div className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <SectionCard title="Allowed commands" subtitle="Whitelists visibles para operación indirecta segura.">
          <CommandConsole>
            <div className="grid gap-4 md:grid-cols-2">
              {snapshot.commandWhitelist.map((command) => (
                <div key={command} className="rounded-[20px] border border-slate-100 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700">
                  {command}
                </div>
              ))}
            </div>
          </CommandConsole>
        </SectionCard>

        <div className="space-y-6">
          <InfoPanel eyebrow="Safety" title="No arbitrary execution" description="La UI no dispara comandos arbitrarios; solo expone control indirecto basado en whitelists y tareas." tone="warning" />
          <InfoPanel eyebrow="Agents" title={`${snapshot.availableAgents.length} visible`} description={snapshot.availableAgents.length > 0 ? snapshot.availableAgents.map((agent) => agent.name).join(' · ') : 'No hay agentes visibles desde este snapshot.'} tone="default" />
        </div>
      </div>

      <SectionCard title="Recent console logs" subtitle="Señales recientes expuestas por el snapshot actual.">
        {snapshot.logs.length === 0 ? (
          <EmptyState title="Sin logs disponibles" description="No se recibieron eventos recientes desde la capa de consola." />
        ) : (
          <DataTable
            columns={['Level', 'Timestamp', 'Message']}
            rows={snapshot.logs.map((log, index) => [log.level, log.timestamp, <div key={`${log.timestamp}-${index}`} className="max-w-3xl text-sm leading-6 text-slate-600">{log.message}</div>])}
          />
        )}
      </SectionCard>
    </PageShell>
  );
}
