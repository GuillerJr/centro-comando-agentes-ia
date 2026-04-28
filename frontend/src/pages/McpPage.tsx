import { useEffect, useState } from 'react';
import { commandCenterApi } from '../api/commandCenterApi';
import { DataTable, ErrorState, InfoPanel, LoadingState, PageShell, SectionCard, StatusBadge } from '../components/ui';
import type { McpServer, McpTool } from '../types/domain';

export function McpPage() {
  const [servers, setServers] = useState<McpServer[]>([]);
  const [tools, setTools] = useState<McpTool[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([commandCenterApi.getMcpServers(), commandCenterApi.getMcpTools()])
      .then(([loadedServers, loadedTools]) => {
        setServers(loadedServers);
        setTools(loadedTools);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'No se pudo cargar MCP.'));
  }, []);

  if (error) return <ErrorState message={error} />;
  if (!servers || !tools) return <LoadingState label="Cargando MCP..." />;

  return (
    <PageShell title="MCP workspace" description="Inventario de servidores MCP, tools expuestas, permisos y preparación de extensibilidad para el centro de comando.">
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard title="Servers" subtitle="Vista principal de servidores MCP registrados y su estado operativo.">
          <DataTable
            columns={['Server', 'Status', 'Transport', 'Endpoint']}
            rows={servers.map((server) => [server.name, <StatusBadge status={server.status} />, server.transport_type, <div className="max-w-xs text-sm leading-6 text-slate-600">{server.endpoint ?? 'n/a'}</div>])}
          />
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="Tools" subtitle="Tools conocidas por la capa MCP actual.">
            <DataTable
              columns={['Tool', 'Permission', 'Status']}
              rows={tools.map((tool) => [tool.name, tool.permission_level, <StatusBadge status={tool.status} />])}
            />
          </SectionCard>

          <div className="grid gap-4">
            <InfoPanel eyebrow="Servers" title={`${servers.length} registered`} description="Cantidad de servidores MCP conocidos por el sistema en este despliegue." tone="default" />
            <InfoPanel eyebrow="Tools" title={`${tools.length} visible`} description="Tools actualmente reflejadas en la UI como parte de la preparación MCP." tone="success" />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
