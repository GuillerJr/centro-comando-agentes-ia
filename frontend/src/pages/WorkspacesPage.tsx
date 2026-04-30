import { useEffect, useState } from 'react';
import { commandCenterApi } from '../api/commandCenterApi';
import { Button } from '../components/button';
import { Input } from '../components/input';
import { Modal } from '../components/modal';
import { ActionFeedback, ChipGroup, DataTable, ErrorState, FormField, LoadingState, PageShell, SectionCard, StatsGrid, StatusBadge, formatDisplayText } from '../components/ui';
import type { Workspace } from '../types/domain';

export function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', description: '', ownerName: 'Guiller', ownerEmail: '' });

  const loadWorkspaces = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setWorkspaces(await commandCenterApi.getWorkspaces());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudieron cargar los workspaces.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadWorkspaces();
  }, []);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      setFeedback(null);
      await commandCenterApi.createWorkspace(form);
      setFeedback('El workspace se creó correctamente.');
      setModalOpen(false);
      setForm({ name: '', slug: '', description: '', ownerName: 'Guiller', ownerEmail: '' });
      await loadWorkspaces();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo crear el workspace.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error && isLoading) return <ErrorState message={error} action={<Button onClick={() => void loadWorkspaces()}>Reintentar</Button>} />;
  if (isLoading) return <LoadingState label="Cargando workspaces..." />;

  return (
    <PageShell title="Espacios" description="Base inicial para separar contexto, propiedad y visibilidad dentro de Mission Control." action={<Button onClick={() => setModalOpen(true)}>Crear espacio</Button>}>
      {error ? <ActionFeedback tone="warning" message={error} /> : null}
      {feedback ? <ActionFeedback tone="success" message={feedback} /> : null}

      <StatsGrid
        className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
        items={[
          { eyebrow: 'Espacios', title: `${workspaces.length} activos`, description: 'Superficies organizativas visibles en esta base inicial.', tone: 'default' },
          { eyebrow: 'Responsables', title: `${workspaces.reduce((sum, workspace) => sum + Number(workspace.owner_count), 0)}`, description: 'Responsables principales registrados por espacio.', tone: 'success' },
          { eyebrow: 'Miembros', title: `${workspaces.reduce((sum, workspace) => sum + Number(workspace.member_count), 0)}`, description: 'Capacidad humana ya asignada a los espacios creados.', tone: 'default' },
        ]}
      />

      <SectionCard title="Inventario de espacios" subtitle="Primer paso para evolucionar hacia aislamiento multi-contexto, roles y propiedad real.">
        <DataTable
          columns={['Espacio', 'Estado', 'Slug', 'Miembros', 'Responsables', 'Roles visibles']}
          rows={workspaces.map((workspace) => [
            <div className="max-w-md"><p className="text-sm font-semibold text-white">{workspace.name}</p><p className="mt-1 text-xs text-zinc-500">{workspace.description}</p></div>,
            <StatusBadge status={workspace.status} />,
            <span className="font-mono text-xs text-zinc-400">{workspace.slug}</span>,
            <span className="text-sm text-zinc-300">{workspace.member_count}</span>,
            <span className="text-sm text-zinc-300">{workspace.owner_count}</span>,
            <ChipGroup items={(workspace.memberships ?? []).map((membership) => `${membership.display_name}: ${formatDisplayText(membership.role_key)}`)} emptyLabel="Sin roles" />,
          ])}
        />
      </SectionCard>

      <SectionCard title="Matriz inicial de roles" subtitle="Lectura visible de membresías por espacio para preparar la futura gobernanza real.">
        <DataTable
          columns={['Espacio', 'Persona', 'Rol', 'Estado']}
          rows={workspaces.flatMap((workspace) => (workspace.memberships ?? []).map((membership) => [
            <span className="text-sm font-semibold text-white">{workspace.name}</span>,
            <div><p className="text-sm text-zinc-200">{membership.display_name}</p><p className="text-xs text-zinc-500">{membership.email}</p></div>,
            <span className="text-sm text-zinc-300">{formatDisplayText(membership.role_key)}</span>,
            <StatusBadge status={membership.user_status} />,
          ]))}
        />
      </SectionCard>

      <Modal open={modalOpen} onOpenChange={setModalOpen} title="Crear espacio" description="Define un espacio inicial con su responsable principal.">
        <form className="space-y-4" onSubmit={handleCreate}>
          <FormField label="Nombre"><Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></FormField>
          <FormField label="Slug"><Input value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value.toLowerCase() }))} /></FormField>
          <FormField label="Descripción"><textarea className="panel-input min-h-[120px]" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></FormField>
          <FormField label="Responsable inicial"><Input value={form.ownerName} onChange={(event) => setForm((current) => ({ ...current, ownerName: event.target.value }))} /></FormField>
          <FormField label="Email del responsable"><Input type="email" value={form.ownerEmail} onChange={(event) => setForm((current) => ({ ...current, ownerEmail: event.target.value }))} /></FormField>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Crear espacio'}</Button>
        </form>
      </Modal>
    </PageShell>
  );
}
