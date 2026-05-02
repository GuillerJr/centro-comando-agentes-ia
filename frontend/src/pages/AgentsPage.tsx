import { useEffect, useState } from 'react';
import { commandCenterApi } from '../api/commandCenterApi';
import { Button } from '../components/button';
import { Input } from '../components/input';
import { Modal } from '../components/modal';
import { CreateButton, IconEditButton, IconToggleButton } from '../components/table-actions';
import { ActionFeedback, DataTable, ErrorState, FormField, formatDisplayText, LoadingState, PageShell, SectionCard, StatsGrid, StatusBadge } from '../components/ui';
import { usePersistedFilters } from '../hooks/use-persisted-filters';
import type { Agent } from '../types/domain';
import { agentFormSchema } from '../utils/validation';

export function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    agentType: 'specialist',
    priority: 60,
    executionLimit: 5,
    communicationChannel: '',
    communicationChannelType: 'telegram',
    communicationProvider: 'telegram',
    communicationTarget: '',
    communicationMode: 'direct',
    communicationIsDedicated: true,
    communicationReplyPolicy: 'same_channel',
  });
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { filters, set } = usePersistedFilters({ storageKey: 'cc-filters-agents', initialState: { search: '', statusFilter: 'all' } });

  const loadAgents = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      setAgents(await commandCenterApi.getAgents());
    } catch (reason) {
      setLoadError(reason instanceof Error ? reason.message : 'No se pudieron cargar los agentes.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void loadAgents(); }, []);

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      agentType: 'specialist',
      priority: 60,
      executionLimit: 5,
      communicationChannel: '',
      communicationChannelType: 'telegram',
      communicationProvider: 'telegram',
      communicationTarget: '',
      communicationMode: 'direct',
      communicationIsDedicated: true,
      communicationReplyPolicy: 'same_channel',
    });
    setEditingAgent(null);
    setEditingAgentId(null);
    setIsModalOpen(false);
    setActionError(null);
  };

  const openCreate = () => {
    setFeedback(null);
    setActionError(null);
    setEditingAgent(null);
    setEditingAgentId(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleModalChange = (open: boolean) => {
    if (!open) {
      resetForm();
      return;
    }

    setIsModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);
    const parsed = agentFormSchema.safeParse(form);
    if (!parsed.success) {
      setActionError(parsed.error.issues[0]?.message ?? 'Formulario inválido.');
      return;
    }

    const metadata = {
      ...(editingAgent?.metadata ?? {}),
      communicationLegacy: {
        channel: form.communicationChannel || null,
        type: form.communicationChannelType,
      },
    };

    const payload = {
      ...parsed.data,
      communicationChannel: form.communicationChannel || null,
      communicationChannelType: form.communicationChannelType,
      communicationProvider: form.communicationProvider,
      communicationTarget: form.communicationTarget || null,
      communicationMode: form.communicationMode,
      communicationIsDedicated: form.communicationIsDedicated,
      communicationReplyPolicy: form.communicationReplyPolicy,
      metadata,
    };

    try {
      setIsSubmitting(true);
      setActionError(null);
      if (editingAgentId) {
        await commandCenterApi.updateAgent(editingAgentId, {
          ...payload,
          status: editingAgent?.status ?? 'active',
          skillIds: editingAgent?.skill_ids ?? [],
        });
        setFeedback('El agente se actualizó correctamente.');
      } else {
        await commandCenterApi.createAgent({ ...payload, status: 'active', skillIds: [] });
        setFeedback('El agente se creó correctamente.');
      }
      resetForm();
      await loadAgents();
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : 'No se pudo guardar el agente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (agent: Agent) => {
    setFeedback(null);
    setActionError(null);
    setEditingAgent(agent);
    setEditingAgentId(agent.id);
    setForm({
      name: agent.name,
      description: agent.description,
      agentType: agent.agent_type,
      priority: agent.priority,
      executionLimit: agent.execution_limit,
      communicationChannel: agent.communication_channel ?? '',
      communicationChannelType: agent.communication_channel_type ?? 'telegram',
      communicationProvider: agent.communication_provider ?? agent.communication_channel_type ?? 'telegram',
      communicationTarget: agent.communication_target ?? agent.communication_channel ?? '',
      communicationMode: agent.communication_mode ?? 'direct',
      communicationIsDedicated: agent.communication_is_dedicated ?? true,
      communicationReplyPolicy: agent.communication_reply_policy ?? 'same_channel',
    });
    setIsModalOpen(true);
  };

  const toggleStatus = async (agent: Agent) => {
    const nextStatus = agent.status === 'active' ? 'inactive' : 'active';
    try {
      setActionError(null);
      setFeedback(null);
      await commandCenterApi.updateAgentStatus(agent.id, nextStatus);
      setFeedback(`El agente ${agent.name} quedó ${formatDisplayText(nextStatus)}.`);
      await loadAgents();
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : 'No se pudo actualizar el estado del agente.');
    }
  };

  if (loadError) return <ErrorState message={loadError} action={<Button onClick={() => void loadAgents()}>Reintentar</Button>} />;
  if (isLoading) return <LoadingState label="Cargando agentes..." />;

  const filteredAgents = agents.filter((agent) => {
    const channel = agent.communication_channel ?? '';
    const target = agent.communication_target ?? '';
    const matchesSearch = `${agent.name} ${agent.description} ${agent.agent_type} ${channel} ${target}`.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = filters.statusFilter === 'all' || agent.status === filters.statusFilter;
    return matchesSearch && matchesStatus;
  });
  const activeAgents = agents.filter((agent) => agent.status === 'active').length;
  const averagePriority = agents.length > 0 ? Math.round(agents.reduce((total, agent) => total + agent.priority, 0) / agents.length) : 0;
  const distribution = Array.from(new Set(agents.map((agent) => agent.agent_type)));

  return (
    <PageShell title="Agentes" description="Registro operativo de agentes, prioridad, límites y configuración de comunicación por agente centrada en Telegram.">
      {!isModalOpen && actionError ? <ActionFeedback tone="warning" message={actionError} /> : null}
      {feedback ? <ActionFeedback tone="success" message={feedback} /> : null}
      <StatsGrid
        className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
        items={[
          { eyebrow: 'Capacidad', title: `${activeAgents} activos`, description: 'Agentes actualmente disponibles para orquestación y ejecución.', tone: 'success' },
          { eyebrow: 'Cobertura', title: `${agents.length} registrados`, description: 'Inventario total con trazabilidad y parámetros operativos.', tone: 'default' },
          { eyebrow: 'Canales dedicados', title: `${agents.filter((agent) => agent.communication_is_dedicated).length}`, description: 'Agentes con destino separado del canal principal del operador.', tone: 'default' },
        ]}
      />

      <SectionCard title="Lectura operativa" subtitle="Resumen compacto para ver mezcla de perfiles y presión disponible antes de crear o pausar agentes.">
        <DataTable
          columns={['Indicador', 'Valor', 'Lectura']}
          rows={[
            ['Prioridad media', averagePriority, 'Promedio de prioridad para repartir carga y atención.'],
            ['Distribución', distribution.length, 'Tipos distintos visibles en el inventario actual.'],
            ['Cobertura activa', `${agents.length > 0 ? Math.round((activeAgents / agents.length) * 100) : 0}%`, 'Porcentaje operativo frente al total registrado.'],
          ]}
        />
      </SectionCard>

      <SectionCard title="Registro de agentes" subtitle="Gestión centralizada mediante tabla, acciones compactas y modales." action={<CreateButton label="Crear agente" onClick={openCreate} />}>
        <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
          <Input placeholder="Buscar agente, canal o destino..." value={filters.search} onChange={(event) => set('search', event.target.value)} />
          <select className="panel-input" value={filters.statusFilter} onChange={(event) => set('statusFilter', event.target.value)}><option value="all">todos los estados</option><option value="active">activos</option><option value="inactive">inactivos</option><option value="error">error</option><option value="maintenance">mantenimiento</option></select>
        </div>
        <DataTable
          columns={['Nombre', 'Tipo', 'Proveedor', 'Destino', 'Modo', 'Estado', 'Acciones']}
          rows={filteredAgents.map((agent) => [
            <div className="max-w-xs"><p className="text-sm font-semibold text-white">{agent.name}</p><p className="mt-1 text-xs text-zinc-500">{agent.description}</p></div>,
            <span className="text-sm text-zinc-300">{formatDisplayText(agent.agent_type)}</span>,
            <span className="text-sm text-zinc-300">{agent.communication_provider ? formatDisplayText(agent.communication_provider) : 'Sin proveedor'}</span>,
            <div className="max-w-[220px] text-sm text-zinc-300"><p>{agent.communication_target ?? 'Sin destino'}</p><p className="mt-1 text-xs text-zinc-500">{agent.communication_is_dedicated ? 'Canal dedicado' : 'Comparte canal principal'}</p></div>,
            <span className="text-sm text-zinc-300">{agent.communication_mode ? formatDisplayText(agent.communication_mode) : 'Sin modo'}</span>,
            <StatusBadge status={agent.status} />,
            <div className="flex flex-wrap gap-2"><IconEditButton onClick={() => startEdit(agent)} /><IconToggleButton active={agent.status === 'active'} onClick={() => void toggleStatus(agent)} /><Button size="sm" variant="secondary" onClick={() => void commandCenterApi.updateAgent(agent.id, { name: agent.name, description: agent.description, agentType: agent.agent_type, status: agent.status, skillIds: agent.skill_ids, priority: Math.min(100, agent.priority + 5), executionLimit: agent.execution_limit, communicationChannel: agent.communication_channel ?? null, communicationChannelType: agent.communication_channel_type ?? null, communicationProvider: agent.communication_provider ?? null, communicationTarget: agent.communication_target ?? null, communicationMode: agent.communication_mode ?? null, communicationIsDedicated: agent.communication_is_dedicated ?? false, communicationReplyPolicy: agent.communication_reply_policy ?? null, metadata: agent.metadata ?? {} }).then(loadAgents).then(() => setFeedback(`La prioridad de ${agent.name} subió a ${Math.min(100, agent.priority + 5)}.`)).catch((reason) => setActionError(reason instanceof Error ? reason.message : 'No se pudo subir la prioridad.'))}>+Prioridad</Button><Button size="sm" variant="ghost" onClick={() => void commandCenterApi.testAgentCommunication(agent.id, { message: `Prueba operativa para ${agent.name}`, initiatedBy: 'Guiller' }).then((result) => setFeedback(`Prueba preparada para ${agent.name}: ${(result as { status?: string }).status ?? 'ok'}.`)).catch((reason) => setActionError(reason instanceof Error ? reason.message : 'No se pudo preparar la prueba de comunicación.'))}>Probar canal</Button></div>,
          ])}
        />
      </SectionCard>

      <Modal open={isModalOpen} onOpenChange={handleModalChange} title={editingAgentId ? 'Editar agente' : 'Crear agente'} description="Formulario compacto para alta o edición de agentes con configuración de comunicación independiente.">
        <form className="space-y-4" onSubmit={handleSubmit}>
          {actionError ? <ActionFeedback tone="warning" message={actionError} /> : null}
          <FormField label="Nombre" helper="Identificador visible en el centro de comando."><Input placeholder="Nombre del agente" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></FormField>
          <FormField label="Descripción" helper="Explica su rol principal y qué clase de trabajo puede asumir."><textarea className="panel-input min-h-[120px]" placeholder="Descripción" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></FormField>
          <FormField label="Tipo"><select className="panel-input" value={form.agentType} onChange={(event) => setForm((current) => ({ ...current, agentType: event.target.value }))}>
            <option value="orchestrator">orquestador</option>
            <option value="specialist">especialista</option>
            <option value="executor">ejecutor</option>
            <option value="observer">observador</option>
            <option value="system">sistema</option>
          </select></FormField>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Prioridad" helper="Escala de 1 a 100."><Input type="number" min={1} max={100} value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: Number(event.target.value) }))} /></FormField>
            <FormField label="Límite de ejecución" helper="Cantidad máxima de ejecuciones simultáneas."><Input type="number" min={1} max={100} value={form.executionLimit} onChange={(event) => setForm((current) => ({ ...current, executionLimit: Number(event.target.value) }))} /></FormField>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Proveedor de comunicación" helper="Por ahora el canal soportado operativamente en esta fase es Telegram."><Input value="telegram" disabled /></FormField>
            <FormField label="Destino de Telegram" helper="Usa un chat id, usuario o referencia estable distinta de tu canal principal con OpenClaw."><Input placeholder="telegram:-100xxxxxxx o telegram:@agente_ui" value={form.communicationTarget} onChange={(event) => setForm((current) => ({ ...current, communicationTarget: event.target.value, communicationChannel: event.target.value, communicationProvider: 'telegram', communicationChannelType: 'telegram' }))} /></FormField>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Modo de comunicación"><select className="panel-input" value={form.communicationMode} onChange={(event) => setForm((current) => ({ ...current, communicationMode: event.target.value }))}><option value="direct">directo</option><option value="thread">hilo</option><option value="relay">relay</option></select></FormField>
            <FormField label="Política de respuesta"><select className="panel-input" value={form.communicationReplyPolicy} onChange={(event) => setForm((current) => ({ ...current, communicationReplyPolicy: event.target.value }))}><option value="same_channel">mismo canal</option><option value="mission_control">volver a Mission Control</option><option value="notify_only">solo notificar</option></select></FormField>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Referencia resumida del canal" helper="Alias breve visible en tablas y listados."><Input placeholder="telegram:agente-ui" value={form.communicationChannel} onChange={(event) => setForm((current) => ({ ...current, communicationChannel: event.target.value, communicationChannelType: 'telegram', communicationProvider: 'telegram' }))} /></FormField>
            <FormField label="Tipo de canal heredado" helper="Se mantiene en telegram para esta primera fase."><Input value="telegram" disabled /></FormField>
          </div>
          <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-zinc-300">
            <input type="checkbox" checked={form.communicationIsDedicated} onChange={(event) => setForm((current) => ({ ...current, communicationIsDedicated: event.target.checked }))} />
            Este agente usa un destino de Telegram dedicado y distinto del canal principal de OpenClaw con Guiller.
          </label>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : editingAgentId ? 'Guardar cambios' : 'Crear agente'}</Button>
            <Button type="button" variant="secondary" onClick={resetForm}>Cancelar</Button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
}
