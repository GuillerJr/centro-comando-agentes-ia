import { useEffect, useState } from 'react';
import { commandCenterApi } from '../api/commandCenterApi';
import { Button } from '../components/button';
import { Input } from '../components/input';
import { Modal } from '../components/modal';
import { CreateButton, IconEditButton, IconToggleButton } from '../components/table-actions';
import { DataTable, ErrorState, formatDisplayText, LoadingState, PageShell, SectionCard, StatsGrid, StatusBadge } from '../components/ui';
import type { Agent } from '../types/domain';
import { agentFormSchema } from '../utils/validation';

export function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', agentType: 'specialist', priority: 60, executionLimit: 5 });
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadAgents = async () => {
    try {
      setAgents(await commandCenterApi.getAgents());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudieron cargar los agentes.');
    }
  };

  useEffect(() => { void loadAgents(); }, []);

  const resetForm = () => {
    setForm({ name: '', description: '', agentType: 'specialist', priority: 60, executionLimit: 5 });
    setEditingAgentId(null);
    setIsModalOpen(false);
  };

  const openCreate = () => {
    setEditingAgentId(null);
    setForm({ name: '', description: '', agentType: 'specialist', priority: 60, executionLimit: 5 });
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = agentFormSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Formulario inválido.');
      return;
    }
    if (editingAgentId) {
      await commandCenterApi.updateAgent(editingAgentId, { ...parsed.data, status: 'active', skillIds: [], metadata: {} });
    } else {
      await commandCenterApi.createAgent({ ...parsed.data, status: 'active', skillIds: [], metadata: {} });
    }
    resetForm();
    await loadAgents();
  };

  const startEdit = (agent: Agent) => {
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
    await commandCenterApi.updateAgentStatus(agent.id, nextStatus);
    await loadAgents();
  };

  if (error) return <ErrorState message={error} />;
  if (!agents) return <LoadingState label="Cargando agentes..." />;

  return (
    <PageShell title="Agentes" description="Registro operativo de agentes, prioridad, límites y disponibilidad para la red multi-agente.">
      <StatsGrid
        className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
        items={[
          { eyebrow: 'Capacidad', title: `${agents.filter((agent) => agent.status === 'active').length} activos`, description: 'Agentes actualmente disponibles para orquestación y ejecución.', tone: 'success' },
          { eyebrow: 'Cobertura', title: `${agents.length} registrados`, description: 'Inventario total con trazabilidad y parámetros operativos.', tone: 'default' },
          { eyebrow: 'Límites', title: `${agents.reduce((total, agent) => total + agent.execution_limit, 0)} ejecuciones`, description: 'Capacidad agregada declarada antes de repartir carga entre agentes.', tone: 'default' },
        ]}
      />

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

      <Modal open={isModalOpen} onOpenChange={setIsModalOpen} title={editingAgentId ? 'Editar agente' : 'Crear agente'} description="Formulario compacto para alta o edición de agentes.">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input placeholder="Nombre del agente" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          <textarea className="panel-input min-h-[120px]" placeholder="Descripción" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
          <select className="panel-input" value={form.agentType} onChange={(event) => setForm((current) => ({ ...current, agentType: event.target.value }))}>
            <option value="orchestrator">orquestador</option>
            <option value="specialist">especialista</option>
            <option value="executor">ejecutor</option>
            <option value="observer">observador</option>
            <option value="system">sistema</option>
          </select>
          <div className="grid gap-4 md:grid-cols-2">
            <Input type="number" value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: Number(event.target.value) }))} />
            <Input type="number" value={form.executionLimit} onChange={(event) => setForm((current) => ({ ...current, executionLimit: Number(event.target.value) }))} />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="submit">{editingAgentId ? 'Guardar cambios' : 'Crear agente'}</Button>
            <Button type="button" variant="secondary" onClick={resetForm}>Cancelar</Button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
}
