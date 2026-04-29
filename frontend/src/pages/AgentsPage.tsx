import { useEffect, useState } from 'react';
import { commandCenterApi } from '../api/commandCenterApi';
import { Button } from '../components/button';
import { Input } from '../components/input';
import { Modal } from '../components/modal';
import { CreateButton, IconEditButton, IconToggleButton } from '../components/table-actions';
import { ActionFeedback, DataTable, ErrorState, FormField, formatDisplayText, LoadingState, PageShell, SectionCard, StatsGrid, StatusBadge } from '../components/ui';
import type { Agent } from '../types/domain';
import { agentFormSchema } from '../utils/validation';

export function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', agentType: 'specialist', priority: 60, executionLimit: 5 });
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    setForm({ name: '', description: '', agentType: 'specialist', priority: 60, executionLimit: 5 });
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
    setForm({ name: '', description: '', agentType: 'specialist', priority: 60, executionLimit: 5 });
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
    try {
      setIsSubmitting(true);
      setActionError(null);
      if (editingAgentId) {
        await commandCenterApi.updateAgent(editingAgentId, {
          ...parsed.data,
          status: editingAgent?.status ?? 'active',
          skillIds: editingAgent?.skill_ids ?? [],
          metadata: editingAgent?.metadata ?? {},
        });
        setFeedback('El agente se actualizó correctamente.');
      } else {
        await commandCenterApi.createAgent({ ...parsed.data, status: 'active', skillIds: [], metadata: {} });
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

  const activeAgents = agents.filter((agent) => agent.status === 'active').length;
  const averagePriority = agents.length > 0 ? Math.round(agents.reduce((total, agent) => total + agent.priority, 0) / agents.length) : 0;
  const distribution = Array.from(new Set(agents.map((agent) => agent.agent_type)));

  return (
    <PageShell title="Agentes" description="Registro operativo de agentes, prioridad, límites y disponibilidad para la red multi-agente.">
      {!isModalOpen && actionError ? <ActionFeedback tone="warning" message={actionError} /> : null}
      {feedback ? <ActionFeedback tone="success" message={feedback} /> : null}
      <StatsGrid
        className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
        items={[
          { eyebrow: 'Capacidad', title: `${activeAgents} activos`, description: 'Agentes actualmente disponibles para orquestación y ejecución.', tone: 'success' },
          { eyebrow: 'Cobertura', title: `${agents.length} registrados`, description: 'Inventario total con trazabilidad y parámetros operativos.', tone: 'default' },
          { eyebrow: 'Límites', title: `${agents.reduce((total, agent) => total + agent.execution_limit, 0)} ejecuciones`, description: 'Capacidad agregada declarada antes de repartir carga entre agentes.', tone: 'default' },
        ]}
      />

      <SectionCard title="Lectura operativa" subtitle="Resumen compacto para ver mezcla de perfiles y presión disponible antes de crear o pausar agentes.">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="surface-muted p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Prioridad media</p><p className="mt-3 text-2xl font-semibold text-white">{averagePriority}</p><p className="mt-2 text-sm text-zinc-400">Promedio de prioridad para repartir carga y atención.</p></div>
          <div className="surface-muted p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Distribución</p><p className="mt-3 text-2xl font-semibold text-white">{distribution.length}</p><p className="mt-2 text-sm text-zinc-400">Tipos distintos visibles en el inventario actual.</p></div>
          <div className="surface-muted p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Cobertura activa</p><p className="mt-3 text-2xl font-semibold text-white">{agents.length > 0 ? Math.round((activeAgents / agents.length) * 100) : 0}%</p><p className="mt-2 text-sm text-zinc-400">Porcentaje operativo frente al total registrado.</p></div>
        </div>
      </SectionCard>

      <SectionCard title="Registro de agentes" subtitle="Gestión centralizada mediante tabla, acciones compactas y modales." action={<CreateButton label="Crear agente" onClick={openCreate} />}>
        <DataTable
          columns={['Nombre', 'Tipo', 'Estado', 'Prioridad', 'Límite', 'Acciones']}
          rows={agents.map((agent) => [
            <div className="max-w-xs"><p className="text-sm font-semibold text-white">{agent.name}</p><p className="mt-1 text-xs text-zinc-500">{agent.description}</p></div>,
            <span className="text-sm text-zinc-300">{formatDisplayText(agent.agent_type)}</span>,
            <StatusBadge status={agent.status} />,
            <span className="text-sm text-zinc-300">{agent.priority}</span>,
            <span className="text-sm text-zinc-300">{agent.execution_limit}</span>,
            <div className="flex flex-wrap gap-2"><IconEditButton onClick={() => startEdit(agent)} /><IconToggleButton active={agent.status === 'active'} onClick={() => void toggleStatus(agent)} /></div>,
          ])}
        />
      </SectionCard>

      <Modal open={isModalOpen} onOpenChange={handleModalChange} title={editingAgentId ? 'Editar agente' : 'Crear agente'} description="Formulario compacto para alta o edición de agentes.">
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
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : editingAgentId ? 'Guardar cambios' : 'Crear agente'}</Button>
            <Button type="button" variant="secondary" onClick={resetForm}>Cancelar</Button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
}
