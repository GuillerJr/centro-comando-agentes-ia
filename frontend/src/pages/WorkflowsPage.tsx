import { useEffect, useState } from 'react';
import { commandCenterApi } from '../api/commandCenterApi';
import { Button } from '../components/button';
import { Input } from '../components/input';
import { Modal } from '../components/modal';
import { ActionFeedback, ChipGroup, DataTable, ErrorState, FormField, LoadingState, PageShell, SectionCard, StatsGrid } from '../components/ui';
import type { WorkflowTemplate } from '../types/domain';

export function WorkflowsPage() {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', objective: '', defaultPriority: 'medium', recommendedSandbox: true, stepsText: '' });

  // Carga las plantillas reutilizables del constructor inicial de flujos.
  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setTemplates(await commandCenterApi.getWorkflowTemplates());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudieron cargar los workflows.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadTemplates();
  }, []);

  // Convierte líneas de texto en pasos simples reutilizables para la plantilla.
  const parseSteps = () => form.stepsText.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => ({ title: line, description: line, sensitive: false }));

  // Guarda una plantilla operativa básica para relanzarla como misión.
  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      setFeedback(null);
      await commandCenterApi.createWorkflowTemplate({
        name: form.name,
        description: form.description,
        objective: form.objective,
        defaultPriority: form.defaultPriority,
        recommendedSandbox: form.recommendedSandbox,
        steps: parseSteps(),
      });
      setFeedback('La plantilla de workflow se creó correctamente.');
      setForm({ name: '', description: '', objective: '', defaultPriority: 'medium', recommendedSandbox: true, stepsText: '' });
      setModalOpen(false);
      await loadTemplates();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo crear la plantilla.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lanza una misión nueva a partir de la plantilla elegida.
  const handleLaunch = async (workflowId: string, sandbox: boolean) => {
    try {
      setError(null);
      setFeedback(null);
      await commandCenterApi.launchWorkflowTemplate(workflowId, { createdBy: 'Guiller', sandbox });
      setFeedback(`La plantilla se lanzó como misión en modo ${sandbox ? 'sandbox' : 'real'}.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo lanzar la plantilla.');
    }
  };

  if (error && isLoading) return <ErrorState message={error} action={<Button onClick={() => void loadTemplates()}>Reintentar</Button>} />;
  if (isLoading) return <LoadingState label="Cargando workflows..." />;

  return (
    <PageShell title="Workflows" description="Constructor inicial de plantillas reutilizables para lanzar misiones con estructura consistente." action={<Button onClick={() => setModalOpen(true)}>Crear workflow</Button>}>
      {error ? <ActionFeedback tone="warning" message={error} /> : null}
      {feedback ? <ActionFeedback tone="success" message={feedback} /> : null}

      <StatsGrid
        className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
        items={[
          { eyebrow: 'Plantillas', title: `${templates.length} disponibles`, description: 'Inventario actual de secuencias reutilizables.', tone: 'default' },
          { eyebrow: 'Sandbox recomendado', title: `${templates.filter((template) => template.recommended_sandbox).length}`, description: 'Plantillas que nacen orientadas a simulación segura.', tone: 'success' },
          { eyebrow: 'Prioridad alta', title: `${templates.filter((template) => ['high', 'critical'].includes(template.default_priority)).length}`, description: 'Plantillas pensadas para trabajo más sensible o urgente.', tone: 'warning' },
        ]}
      />

      <SectionCard title="Biblioteca de workflows" subtitle="Plantillas reutilizables para convertir procesos repetidos en misiones bien estructuradas.">
        <DataTable
          columns={['Nombre', 'Prioridad', 'Modo recomendado', 'Pasos', 'Acciones']}
          rows={templates.map((template) => [
            <div className="max-w-md"><p className="text-sm font-semibold text-white">{template.name}</p><p className="mt-1 text-xs text-zinc-500">{template.description}</p></div>,
            <span className="text-sm text-zinc-300">{template.default_priority}</span>,
            <span className="text-sm text-zinc-300">{template.recommended_sandbox ? 'Sandbox' : 'Real'}</span>,
            <ChipGroup items={template.steps.map((step) => step.title)} emptyLabel="Sin pasos" />,
            <div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => void handleLaunch(template.id, template.recommended_sandbox)}>Lanzar</Button></div>,
          ])}
        />
      </SectionCard>

      <Modal open={modalOpen} onOpenChange={setModalOpen} title="Crear workflow" description="Define una plantilla básica para relanzar misiones de forma consistente.">
        <form className="space-y-4" onSubmit={handleCreate}>
          <FormField label="Nombre"><Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></FormField>
          <FormField label="Descripción"><Input value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></FormField>
          <FormField label="Objetivo"><textarea className="panel-input min-h-[120px]" value={form.objective} onChange={(event) => setForm((current) => ({ ...current, objective: event.target.value }))} /></FormField>
          <FormField label="Prioridad por defecto"><select className="panel-input" value={form.defaultPriority} onChange={(event) => setForm((current) => ({ ...current, defaultPriority: event.target.value }))}><option value="low">baja</option><option value="medium">media</option><option value="high">alta</option><option value="critical">crítica</option></select></FormField>
          <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-zinc-200"><input type="checkbox" checked={form.recommendedSandbox} onChange={(event) => setForm((current) => ({ ...current, recommendedSandbox: event.target.checked }))} />Recomendar sandbox</label>
          <FormField label="Pasos" helper="Escribe un paso por línea para la plantilla inicial."><textarea className="panel-input min-h-[140px]" value={form.stepsText} onChange={(event) => setForm((current) => ({ ...current, stepsText: event.target.value }))} /></FormField>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Crear workflow'}</Button>
        </form>
      </Modal>
    </PageShell>
  );
}
