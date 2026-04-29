import { useEffect, useState } from 'react';
import { commandCenterApi } from '../api/commandCenterApi';
import { Button } from '../components/button';
import { DataTable, DetailList, EmptyState, ErrorState, formatDateTime, formatDisplayText, LoadingState, PageShell, SectionCard, StatsGrid, StatusBadge } from '../components/ui';
import type { McpServer, McpTool } from '../types/domain';

export function McpPage() {
  const [servers, setServers] = useState<McpServer[]>([]);
  const [tools, setTools] = useState<McpTool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMcp = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [loadedServers, loadedTools] = await Promise.all([commandCenterApi.getMcpServers(), commandCenterApi.getMcpTools()]);
      setServers(loadedServers);
      setTools(loadedTools);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo cargar MCP.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadMcp();
  }, []);

  if (error) return <ErrorState message={error} action={<Button onClick={() => void loadMcp()}>Reintentar</Button>} />;
  if (isLoading) return <LoadingState label="Cargando MCP..." />;

  const firstConnectedServer = servers.find((server) => server.status === 'connected') ?? servers[0];

  return (
    <PageShell title="Espacio MCP" description="Inventario de servidores MCP, herramientas expuestas, permisos y preparación de extensibilidad para el centro de comando.">
      <StatsGrid
        className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
        items={[
          { eyebrow: 'Servidores', title: `${servers.length} registrados`, description: 'Cantidad de servidores MCP conocidos por el sistema en este despliegue.', tone: 'default' },
          { eyebrow: 'Herramientas', title: `${tools.length} visibles`, description: 'Herramientas reflejadas en la interfaz como parte de la preparación MCP.', tone: 'success' },
          { eyebrow: 'Conectados', title: `${servers.filter((server) => server.status === 'connected').length} activos`, description: 'Servidores disponibles ahora mismo para interoperar con el centro de comando.', tone: 'success' },
          { eyebrow: 'Permisos', title: `${new Set(tools.map((tool) => tool.permission_level)).size} niveles`, description: 'Diversidad actual de permisos visibles en la capa MCP.', tone: 'default' },
        ]}
      />

      <div className="grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,1.14fr)_minmax(0,0.86fr)]">
        <SectionCard title="Servidores" subtitle="Vista principal de servidores MCP registrados y su estado operativo.">
          <DataTable
            columns={['Servidor', 'Estado', 'Transporte', 'Endpoint']}
            rows={servers.map((server) => [
              <div className="text-sm font-medium text-white">{server.name}</div>,
              <StatusBadge status={server.status} />,
              <div className="text-sm text-zinc-300">{formatDisplayText(server.transport_type)}</div>,
              <div className="break-all text-sm leading-6 text-zinc-400">{server.endpoint ?? 'no disponible'}</div>,
            ])}
          />
        </SectionCard>

        <div className="space-y-5">
          <SectionCard title="Servidor destacado" subtitle="Resumen operativo del servidor priorizado, sin recurrir a cards adicionales.">
            {firstConnectedServer ? <DataTable
              columns={['Campo', 'Valor']}
              rows={[
                ['Servidor', <span className="text-sm font-medium text-white">{firstConnectedServer.name}</span>],
                ['Estado', <StatusBadge status={firstConnectedServer.status} />],
                ['Último visto', formatDateTime(firstConnectedServer.last_seen_at)],
                ['Permisos', <div className="text-xs leading-6 text-zinc-400">{firstConnectedServer.permissions.length > 0 ? firstConnectedServer.permissions.join(', ') : 'Sin permisos declarados'}</div>],
                ['Acciones', <div className="text-xs leading-6 text-zinc-400">{firstConnectedServer.allowed_actions.length > 0 ? firstConnectedServer.allowed_actions.join(', ') : 'Sin acciones declaradas'}</div>],
              ]}
            /> : <EmptyState title="Sin servidor destacado" description="Todavía no hay servidores MCP registrados para resumir en esta ficha." />}
          </SectionCard>

          <SectionCard title="Herramientas" subtitle="Herramientas conocidas por la capa MCP actual.">
            <DataTable
              columns={['Herramienta', 'Permiso', 'Estado']}
              rows={tools.map((tool) => [
                <div className="text-sm font-medium text-white">{tool.name}</div>,
                <div className="text-sm text-zinc-300">{formatDisplayText(tool.permission_level)}</div>,
                <StatusBadge status={tool.status} />,
              ])}
            />
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}
