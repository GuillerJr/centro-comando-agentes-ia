import { useEffect, useState } from 'react';
import { commandCenterApi } from '../api/commandCenterApi';
import { Button } from '../components/button';
import { Input } from '../components/input';
import { Modal } from '../components/modal';
import { ActionFeedback, DataTable, EmptyState, ErrorState, FormField, formatDateTime, formatDisplayText, LoadingState, PageShell, SectionCard, StatsGrid, StatusBadge } from '../components/ui';
import type { McpServer, McpTool } from '../types/domain';

type McpServerForm = {
  name: string;
  description: string;
  transportType: 'stdio' | 'http' | 'websocket';
  endpoint: string;
  status: 'connected' | 'disconnected' | 'error' | 'maintenance';
  permissions: string;
  allowedActions: string;
};

const defaultForm: McpServerForm = {
  name: '',
  description: '',
  transportType: 'http',
  endpoint: '',
  status: 'disconnected',
  permissions: '',
  allowedActions: '',
};

function toPayload(form: McpServerForm) {
  return {
    name: form.name,
    description: form.description,
    transportType: form.transportType,
    endpoint: form.endpoint.trim() || null,
    status: form.status,
    permissions: form.permissions.split(',').map((item) => item.trim()).filter(Boolean),
    allowedActions: form.allowedActions.split(',').map((item) => item.trim()).filter(Boolean),
    metadata: {},
  };
}

export function McpPage() {
  const [servers, setServers] = useState<McpServer[]>([]);
  const [tools, setTools] = useState<McpTool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingServerId, setEditingServerId] = useState<string | null>(null);
  const [form, setForm] = useState<McpServerForm>(defaultForm);

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

  const resetForm = () => {
    setEditingServerId(null);
    setForm(defaultForm);
    setModalOpen(false);
  };

  const openCreate = () => {
    setEditingServerId(null);
    setForm(defaultForm);
    setModalOpen(true);
  };

  const openEdit = (server: McpServer) => {
    setEditingServerId(server.id);
    setForm({
      name: server.name,
      description: server.description,
      transportType: server.transport_type as McpServerForm['transportType'],
      endpoint: server.endpoint ?? '',
      status: server.status as McpServerForm['status'],
      permissions: server.permissions.join(', '),
      allowedActions: server.allowed_actions.join(', '),
    });
    setModalOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      setFeedback(null);
      const payload = toPayload(form);
      if (editingServerId) {
        await commandCenterApi.updateMcpServer(editingServerId, payload);
        setFeedback('El servidor MCP se actualizó correctamente.');
      } else {
        await commandCenterApi.createMcpServer(payload);
        setFeedback('El servidor MCP se creó correctamente.');
      }
      resetForm();
      await loadMcp();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo guardar el servidor MCP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (server: McpServer) => {
    try {
      setIsSubmitting(true);
      setError(null);
      setFeedback(null);
      const nextStatus = server.status === 'connected' ? 'maintenance' : 'connected';
      await commandCenterApi.updateMcpServerStatus(server.id, nextStatus);
      setFeedback(`El servidor ${server.name} ahora está ${formatDisplayText(nextStatus)}.`);
      await loadMcp();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo actualizar el estado del servidor MCP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error && isLoading) return <ErrorState message={error} action={<Button onClick={() => void loadMcp()}>Reintentar</Button>} />;
  if (isLoading) return <LoadingState label="Cargando MCP..." />;

  return (
    <PageShell title="Espacio MCP" description="Inventario y control operativo real sobre servidores MCP y herramientas expuestas." action={<Button onClick={openCreate}>Crear servidor</Button>}>
      {error ? <ActionFeedback tone="warning" message={error} /> : null}
      {feedback ? <ActionFeedback tone="success" message={feedback} /> : null}
      <StatsGrid
        className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
        items={[
          { eyebrow: 'Servidores', title: `${servers.length} registrados`, description: 'Cantidad de servidores MCP conocidos por el sistema en este despliegue.', tone: 'default' },
          { eyebrow: 'Herramientas', title: `${tools.length} visibles`, description: 'Herramientas reflejadas en la interfaz como parte de la preparación MCP.', tone: 'success' },
          { eyebrow: 'Conectados', title: `${servers.filter((server) => server.status === 'connected').length} activos`, description: 'Servidores disponibles ahora mismo para interoperar con el centro de comando.', tone: 'success' },
          { eyebrow: 'Permisos', title: `${new Set(tools.map((tool) => tool.permission_level)).size} niveles`, description: 'Diversidad actual de permisos visibles en la capa MCP.', tone: 'default' },
        ]}
      />

      <div className="grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <SectionCard title="Servidores MCP" subtitle="Registro principal con control de estado y edición desde tabla.">
          <DataTable
            columns={['Servidor', 'Transporte', 'Estado', 'Endpoint', 'Acciones']}
            rows={servers.map((server) => [
              <div><div className="text-sm font-medium text-white">{server.name}</div><div className="mt-1 text-xs text-zinc-500">{server.description}</div></div>,
              formatDisplayText(server.transport_type),
              <StatusBadge status={server.status} />,
              <div className="max-w-[16rem] break-all text-xs text-zinc-400">{server.endpoint ?? 'no disponible'}</div>,
              <div className="flex flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={() => openEdit(server)}>Editar</Button><Button size="sm" variant="ghost" disabled={isSubmitting} onClick={() => void toggleStatus(server)}>{server.status === 'connected' ? 'Mantenimiento' : 'Conectar'}</Button></div>,
            ])}
          />
        </SectionCard>

        <SectionCard title="Herramientas MCP" subtitle="Herramientas visibles derivadas de los servidores registrados.">
          {tools.length === 0 ? <EmptyState title="Sin herramientas" description="Todavía no hay herramientas MCP expuestas." /> : <DataTable
            columns={['Herramienta', 'Permiso', 'Estado']}
            rows={tools.map((tool) => [<div className="text-sm font-medium text-white">{tool.name}</div>, formatDisplayText(tool.permission_level), <StatusBadge status={tool.status} />])}
          />}
        </SectionCard>
      </div>

      <Modal open={modalOpen} onOpenChange={(open) => { if (!open) resetForm(); else setModalOpen(true); }} title={editingServerId ? 'Editar servidor MCP' : 'Crear servidor MCP'} description="Define endpoint, transporte y permisos operativos del servidor.">
        <form className="space-y-4" onSubmit={submit}>
          <FormField label="Nombre"><Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></FormField>
          <FormField label="Descripción"><Input value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></FormField>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Transporte"><select className="panel-input" value={form.transportType} onChange={(event) => setForm((current) => ({ ...current, transportType: event.target.value as McpServerForm['transportType'] }))}><option value="stdio">stdio</option><option value="http">http</option><option value="websocket">websocket</option></select></FormField>
            <FormField label="Estado"><select className="panel-input" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as McpServerForm['status'] }))}><option value="disconnected">desconectado</option><option value="connected">conectado</option><option value="error">error</option><option value="maintenance">mantenimiento</option></select></FormField>
          </div>
          <FormField label="Endpoint"><Input value={form.endpoint} onChange={(event) => setForm((current) => ({ ...current, endpoint: event.target.value }))} /></FormField>
          <FormField label="Permisos (coma separada)"><Input value={form.permissions} onChange={(event) => setForm((current) => ({ ...current, permissions: event.target.value }))} /></FormField>
          <FormField label="Acciones permitidas (coma separada)"><Input value={form.allowedActions} onChange={(event) => setForm((current) => ({ ...current, allowedActions: event.target.value }))} /></FormField>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : editingServerId ? 'Guardar cambios' : 'Crear servidor'}</Button>
        </form>
      </Modal>
    </PageShell>
  );
}
