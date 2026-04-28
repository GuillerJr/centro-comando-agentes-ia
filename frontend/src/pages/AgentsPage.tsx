import { useEffect, useState } from 'react';
import { commandCenterApi } from '../api/commandCenterApi';
import { Button } from '../components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/card';
import { Input } from '../components/input';
import { AgentCard, EmptyState, ErrorState, InfoPanel, LoadingState, PageShell, SectionCard, StatusBadge } from '../components/ui';
import type { Agent } from '../types/domain';
import { agentFormSchema } from '../utils/validation';

export function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', agentType: 'specialist', priority: 60, executionLimit: 5 });
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);

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
  };

  const toggleStatus = async (agent: Agent) => {
    const nextStatus = agent.status === 'active' ? 'inactive' : 'active';
    await commandCenterApi.updateAgentStatus(agent.id, nextStatus);
    await loadAgents();
  };

  if (error) return <ErrorState message={error} />;
  if (!agents) return <LoadingState label="Cargando agentes..." />;

  return (
    <PageShell title="Agents" description="Registro operativo de agentes, prioridad, límites y disponibilidad para la red multi-agente.">
      <div className="grid gap-6 xl:grid-cols-[0.86fr_1.14fr]">
        <Card>
          <CardHeader>
            <CardTitle>{editingAgentId ? 'Edit agent' : 'Register agent'}</CardTitle>
            <CardDescription>Mantén el inventario limpio, tipado y listo para operación coordinada.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input placeholder="Agent name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
              <textarea className="panel-input min-h-[120px]" placeholder="Description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
              <select className="panel-input" value={form.agentType} onChange={(event) => setForm((current) => ({ ...current, agentType: event.target.value }))}>
                <option value="orchestrator">orchestrator</option>
                <option value="specialist">specialist</option>
                <option value="executor">executor</option>
                <option value="observer">observer</option>
                <option value="system">system</option>
              </select>
              <div className="grid gap-4 md:grid-cols-2">
                <Input type="number" value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: Number(event.target.value) }))} />
                <Input type="number" value={form.executionLimit} onChange={(event) => setForm((current) => ({ ...current, executionLimit: Number(event.target.value) }))} />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button type="submit">{editingAgentId ? 'Save changes' : 'Register agent'}</Button>
                {editingAgentId ? <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button> : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <InfoPanel eyebrow="Capacity" title={`${agents.filter((agent) => agent.status === 'active').length} active`} description="Agentes actualmente disponibles para orquestación y ejecución." tone="success" />
            <InfoPanel eyebrow="Coverage" title={`${agents.length} registered`} description="Inventario total con trazabilidad y parámetros operativos." tone="default" />
          </div>

          <SectionCard title="Agents inventory" subtitle="Vista compacta de la red disponible para operar tareas y flujos.">
            <div className="grid gap-4 md:grid-cols-2">
              {agents.length === 0 ? (
                <EmptyState title="Sin agentes" description="Crea el primer agente operativo para empezar a coordinar trabajo." />
              ) : (
                agents.map((agent) => (
                  <div key={agent.id} className="space-y-3">
                    <AgentCard title={agent.name} description={agent.description} status={agent.status} meta={`${agent.agent_type} · priority ${agent.priority}`} />
                    <div className="flex items-center justify-between gap-3 rounded-[22px] border border-slate-100 bg-slate-50 px-4 py-3">
                      <StatusBadge status={agent.status} />
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="secondary" onClick={() => startEdit(agent)}>Edit</Button>
                        <Button size="sm" variant={agent.status === 'active' ? 'danger' : 'default'} onClick={() => void toggleStatus(agent)}>{agent.status === 'active' ? 'Disable' : 'Enable'}</Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}
