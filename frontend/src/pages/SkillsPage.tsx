import { useEffect, useState } from 'react';
import { commandCenterApi } from '../api/commandCenterApi';
import { Button } from '../components/button';
import { Input } from '../components/input';
import { Modal } from '../components/modal';
import { CreateButton, IconEditButton, IconToggleButton } from '../components/table-actions';
import { ActionFeedback, DataTable, ErrorState, FormField, formatDisplayText, LoadingState, PageShell, SectionCard, StatsGrid, StatusBadge } from '../components/ui';
import type { Skill } from '../types/domain';
import { skillFormSchema } from '../utils/validation';

export function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [form, setForm] = useState({ canonicalName: '', description: '', skillType: 'operations', whenToUse: '', whenNotToUse: '' });
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadSkills = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      setSkills(await commandCenterApi.getSkills());
    } catch (reason) {
      setLoadError(reason instanceof Error ? reason.message : 'No se pudieron cargar las capacidades.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void loadSkills(); }, []);

  const resetForm = () => {
    setForm({ canonicalName: '', description: '', skillType: 'operations', whenToUse: '', whenNotToUse: '' });
    setEditingSkill(null);
    setEditingSkillId(null);
    setIsModalOpen(false);
    setActionError(null);
  };

  const openCreate = () => {
    setFeedback(null);
    setActionError(null);
    setEditingSkill(null);
    setEditingSkillId(null);
    setForm({ canonicalName: '', description: '', skillType: 'operations', whenToUse: '', whenNotToUse: '' });
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
    const parsed = skillFormSchema.safeParse(form);
    if (!parsed.success) {
      setActionError(parsed.error.issues[0]?.message ?? 'Formulario inválido.');
      return;
    }
    const payload = {
      ...parsed.data,
      conversationalAlias: editingSkill?.conversational_alias ?? null,
      status: editingSkill?.status ?? 'active',
      relatedSkills: editingSkill?.related_skills ?? [],
      qualityChecklist: editingSkill?.quality_checklist ?? [],
      metadata: editingSkill?.metadata ?? {},
    };
    try {
      setIsSubmitting(true);
      setActionError(null);
      if (editingSkillId) {
        await commandCenterApi.updateSkill(editingSkillId, payload);
        setFeedback('La capacidad se actualizó correctamente.');
      } else {
        await commandCenterApi.createSkill(payload);
        setFeedback('La capacidad se creó correctamente.');
      }
      resetForm();
      await loadSkills();
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : 'No se pudo guardar la capacidad.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (skill: Skill) => {
    setFeedback(null);
    setActionError(null);
    setEditingSkill(skill);
    setEditingSkillId(skill.id);
    setForm({
      canonicalName: skill.canonical_name,
      description: skill.description,
      skillType: skill.skill_type,
      whenToUse: skill.when_to_use,
      whenNotToUse: skill.when_not_to_use,
    });
    setIsModalOpen(true);
  };

  if (loadError) return <ErrorState message={loadError} action={<Button onClick={() => void loadSkills()}>Reintentar</Button>} />;
  if (isLoading) return <LoadingState label="Cargando capacidades..." />;

  return (
    <PageShell title="Capacidades" description="Registro canónico de capacidades, límites y criterio de uso dentro del sistema multi-agente.">
      {!isModalOpen && actionError ? <ActionFeedback tone="warning" message={actionError} /> : null}
      {feedback ? <ActionFeedback tone="success" message={feedback} /> : null}
      <StatsGrid
        className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
        items={[
          { eyebrow: 'Inventario', title: `${skills.length} visibles`, description: 'Capacidades activas y visibles dentro del centro de comando.', tone: 'default' },
          { eyebrow: 'Gobernanza', title: 'Catálogo canónico aplicado', description: 'La operación se apoya en un lenguaje común, límites explícitos y semántica consistente.', tone: 'success' },
          { eyebrow: 'Cobertura', title: `${new Set(skills.map((skill) => skill.skill_type)).size} dominios`, description: 'Áreas funcionales cubiertas por el catálogo disponible.', tone: 'default' },
        ]}
      />

      <SectionCard title="Lectura del catálogo" subtitle="Ayuda a verificar si el inventario de capacidades está balanceado antes de asignarlas a tareas o agentes.">
        <DataTable
          columns={['Indicador', 'Valor', 'Lectura']}
          rows={[
            ['Activas', skills.filter((skill) => skill.status === 'active').length, 'Capacidades listas para uso inmediato.'],
            ['Sin alias', skills.filter((skill) => !skill.conversational_alias).length, 'Entradas pendientes de sinónimo conversacional.'],
            ['Promedio checklist', skills.length > 0 ? Math.round(skills.reduce((total, skill) => total + skill.quality_checklist.length, 0) / skills.length) : 0, 'Punto de partida para elevar calidad y gobernanza.'],
          ]}
        />
      </SectionCard>

      <SectionCard title="Registro de capacidades" subtitle="Gestión centralizada mediante tabla y modales." action={<CreateButton label="Crear capacidad" onClick={openCreate} />}>
        <DataTable
          columns={['Canónico', 'Tipo', 'Estado', 'Uso', 'Acciones']}
          rows={skills.map((skill) => [
            <div className="max-w-xs"><p className="text-sm font-semibold text-white">{skill.canonical_name}</p><p className="mt-1 text-xs text-zinc-500">{skill.conversational_alias ?? 'sin alias'}</p></div>,
            <span className="text-sm text-zinc-300">{formatDisplayText(skill.skill_type)}</span>,
            <StatusBadge status={skill.status} />,
            <div className="max-w-md text-sm leading-6 text-zinc-400">{skill.when_to_use}</div>,
            <div className="flex flex-wrap gap-2"><IconEditButton onClick={() => startEdit(skill)} /><IconToggleButton active={skill.status === 'active'} onClick={() => void commandCenterApi.updateSkill(skill.id, { canonicalName: skill.canonical_name, conversationalAlias: skill.conversational_alias ?? null, description: skill.description, skillType: skill.skill_type, status: skill.status === 'active' ? 'inactive' : 'active', whenToUse: skill.when_to_use, whenNotToUse: skill.when_not_to_use, relatedSkills: skill.related_skills, qualityChecklist: skill.quality_checklist, metadata: skill.metadata ?? {} }).then(loadSkills).then(() => setFeedback(`La capacidad ${skill.canonical_name} quedó ${skill.status === 'active' ? 'inactiva' : 'activa'}.`)).catch((reason) => setActionError(reason instanceof Error ? reason.message : 'No se pudo actualizar la capacidad.'))} /></div>,
          ])}
        />
      </SectionCard>

      <Modal open={isModalOpen} onOpenChange={handleModalChange} title={editingSkillId ? 'Editar capacidad' : 'Crear capacidad'} description="Formulario compacto para alta o edición del catálogo.">
        <form className="space-y-4" onSubmit={handleSubmit}>
          {actionError ? <ActionFeedback tone="warning" message={actionError} /> : null}
          <FormField label="Nombre canónico" helper="Nombre principal usado por el catálogo."><Input placeholder="Nombre canónico" value={form.canonicalName} onChange={(event) => setForm((current) => ({ ...current, canonicalName: event.target.value }))} /></FormField>
          <FormField label="Descripción"><textarea className="panel-input min-h-[96px]" placeholder="Descripción" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></FormField>
          <FormField label="Tipo"><select className="panel-input" value={form.skillType} onChange={(event) => setForm((current) => ({ ...current, skillType: event.target.value }))}>
            <option value="governance">gobernanza</option>
            <option value="architecture">arquitectura</option>
            <option value="frontend">frontend</option>
            <option value="backend">backend</option>
            <option value="database">base de datos</option>
            <option value="mcp">MCP</option>
            <option value="ui">interfaz</option>
            <option value="fullstack">full stack</option>
            <option value="operations">operaciones</option>
          </select></FormField>
          <FormField label="Cuándo usar"><textarea className="panel-input min-h-[92px]" placeholder="Cuándo usar" value={form.whenToUse} onChange={(event) => setForm((current) => ({ ...current, whenToUse: event.target.value }))} /></FormField>
          <FormField label="Cuándo no usar"><textarea className="panel-input min-h-[92px]" placeholder="Cuándo no usar" value={form.whenNotToUse} onChange={(event) => setForm((current) => ({ ...current, whenNotToUse: event.target.value }))} /></FormField>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : editingSkillId ? 'Guardar cambios' : 'Crear capacidad'}</Button>
            <Button type="button" variant="secondary" onClick={resetForm}>Cancelar</Button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
}
