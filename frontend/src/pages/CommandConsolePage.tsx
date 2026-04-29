import { useEffect, useState } from 'react';
import { commandCenterApi } from '../api/commandCenterApi';
import { Button } from '../components/button';
import { ChipGroup, CommandConsole, ConsoleEmptyGuide, DataTable, EmptyState, ErrorState, formatDateTime, formatDisplayText, LoadingState, MetricPill, PageShell, SectionCard, StatsGrid, StatusBadge } from '../components/ui';
import type { ConsoleSnapshot } from '../types/domain';

export function CommandConsolePage() {
  const [snapshot, setSnapshot] = useState<ConsoleSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSnapshot = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSnapshot(await commandCenterApi.getConsoleSnapshot());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo cargar la consola operativa.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSnapshot();
  }, []);

  if (error) return <ErrorState message={error} action={<Button onClick={() => void loadSnapshot()}>Reintentar</Button>} />;
  if (isLoading) return <LoadingState label="Cargando consola operativa..." />;
  if (!snapshot) return <EmptyState title="Sin captura de consola" description="No se recibió un snapshot utilizable desde la capa operativa." action={<Button onClick={() => void loadSnapshot()}>Actualizar</Button>} />;

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
            {snapshot.commandWhitelist.length === 0 ? (
              <EmptyState title="Sin comandos permitidos" description="La capa adaptadora no publicó una lista permitida en este momento." />
            ) : (
              <DataTable
                columns={['Comando', 'Clase']}
                rows={snapshot.commandWhitelist.map((command) => [<div className="break-all text-sm font-medium text-white sm:break-normal">{formatDisplayText(command)}</div>, <span className="text-xs text-zinc-500">Permitido</span>])}
              />
            )}
          </CommandConsole>
        </SectionCard>

        <ConsoleEmptyGuide />
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title="Agentes visibles" subtitle="Inventario expuesto por el snapshot de consola actual.">
          {snapshot.availableAgents.length === 0 ? (
            <EmptyState title="Sin agentes visibles" description="La captura actual no devolvió agentes disponibles." />
          ) : (
            <DataTable
              columns={['Agente', 'Tipo', 'Estado']}
              rows={snapshot.availableAgents.map((agent) => [agent.name, formatDisplayText(agent.type), <StatusBadge status={agent.status} />])}
            />
          )}
        </SectionCard>

        <SectionCard title="Capacidades visibles" subtitle="Capacidades que el snapshot de consola declara como disponibles.">
          {snapshot.availableSkills.length === 0 ? (
            <EmptyState title="Sin capacidades visibles" description="No se publicaron capacidades disponibles en esta captura." />
          ) : (
            <DataTable
              columns={['Capacidad', 'Tipo']}
              rows={snapshot.availableSkills.map((skill) => [<div className="text-sm font-medium text-white">{skill.canonicalName}</div>, <ChipGroup items={[skill.type]} />])}
            />
          )}
        </SectionCard>
      </div>

      <SectionCard title="Registros recientes" subtitle="Eventos recientes expuestos por el estado actual.">
        {snapshot.logs.length === 0 ? (
          <EmptyState title="Sin logs disponibles" description="No se recibieron eventos recientes desde la capa de consola." />
        ) : (
          <DataTable
            columns={['Nivel', 'Fecha', 'Mensaje']}
            rows={snapshot.logs.map((log, index) => [formatDisplayText(log.level), formatDateTime(log.timestamp), <div key={`${log.timestamp}-${index}`} className="max-w-3xl text-sm leading-6 text-zinc-400">{log.message}</div>])}
          />
        )}
      </SectionCard>
    </PageShell>
  );
}
