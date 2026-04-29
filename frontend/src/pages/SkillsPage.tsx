import { useEffect, useState } from 'react';
import { commandCenterApi } from '../api/commandCenterApi';
import { Button } from '../components/button';
import { Input } from '../components/input';
import { Modal } from '../components/modal';
import { CreateButton, IconEditButton } from '../components/table-actions';
import { DataTable, ErrorState, formatDisplayText, LoadingState, PageShell, SectionCard, StatsGrid, StatusBadge } from '../components/ui';
import type { Skill } from '../types/domain';
import { skillFormSchema } from '../utils/validation';

export function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ canonicalName: '', description: '', skillType: 'operations', whenToUse: '', whenNotToUse: '' });
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadSkills = async () => {
    try {
      setSkills(await commandCenterApi.getSkills());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudieron cargar las capacidades.');
    }
  };

  useEffect(() => { void loadSkills(); }, []);

  const resetForm = () => {
    setForm({ canonicalName: '', description: '', skillType: 'operations', whenToUse: '', whenNotToUse: '' });
    setEditingSkillId(null);
    setIsModalOpen(false);
  };

  const openCreate = () => {
    setEditingSkillId(null);
    setForm({ canonicalName: '', description: '', skillType: 'operations', whenToUse: '', whenNotToUse: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = skillFormSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Formulario inválido.');
      return;
    }
    const payload = { ...parsed.data, conversationalAlias: null, status: 'active', relatedSkills: [], qualityChecklist: [], metadata: {} };
    if (editingSkillId) {
      await commandCenterApi.updateSkill(editingSkillId, payload);
    } else {
      await commandCenterApi.createSkill(payload);
    }
    resetForm();
    await loadSkills();
  };

  const startEdit = (skill: Skill) => {
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

  if (error) return <ErrorState message={error} />;
  if (!skills) return <LoadingState label="Cargando capacidades..." />;

  return (
    <PageShell title="Capacidades" description="Registro canónico de capacidades, límites y criterio de uso dentro del sistema multi-agente.">
      <StatsGrid
        className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
        items={[
          { eyebrow: 'Inventario', title: `${skills.length} visibles`, description: 'Capacidades activas y visibles dentro del centro de comando.', tone: 'default' },
          { eyebrow: 'Gobernanza', title: 'Catálogo canónico aplicado', description: 'La operación se apoya en un lenguaje común, límites explícitos y semántica consistente.', tone: 'success' },
          { eyebrow: 'Cobertura', title: `${new Set(skills.map((skill) => skill.skill_type)).size} dominios`, description: 'Áreas funcionales cubiertas por el catálogo disponible.', tone: 'default' },
        ]}
      />

      <SectionCard title="Registro de capacidades" subtitle="Gestión centralizada mediante tabla y modales." action={<CreateButton label="Crear capacidad" onClick={openCreate} />}>
        <DataTable
          columns={['Canónico', 'Tipo', 'Estado', 'Uso', 'Acciones']}
          rows={skills.map((skill) => [
            <div className="max-w-xs"><p className="text-sm font-semibold text-white">{skill.canonical_name}</p><p className="mt-1 text-xs text-zinc-500">{skill.conversational_alias ?? 'sin alias'}</p></div>,
            <span className="text-sm text-zinc-300">{formatDisplayText(skill.skill_type)}</span>,
            <StatusBadge status={skill.status} />,
            <div className="max-w-md text-sm leading-6 text-zinc-400">{skill.when_to_use}</div>,
            <div className="flex flex-wrap gap-2"><IconEditButton onClick={() => startEdit(skill)} /></div>,
          ])}
        />
      </SectionCard>

      <Modal open={isModalOpen} onOpenChange={setIsModalOpen} title={editingSkillId ? 'Editar capacidad' : 'Crear capacidad'} description="Formulario compacto para alta o edición del catálogo.">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input placeholder="Nombre canónico" value={form.canonicalName} onChange={(event) => setForm((current) => ({ ...current, canonicalName: event.target.value }))} />
          <textarea className="panel-input min-h-[96px]" placeholder="Descripción" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
          <select className="panel-input" value={form.skillType} onChange={(event) => setForm((current) => ({ ...current, skillType: event.target.value }))}>
            <option value="governance">gobernanza</option>
            <option value="architecture">arquitectura</option>
            <option value="frontend">frontend</option>
            <option value="backend">backend</option>
            <option value="database">base de datos</option>
            <option value="mcp">MCP</option>
            <option value="ui">interfaz</option>
            <option value="fullstack">full stack</option>
            <option value="operations">operaciones</option>
          </select>
          <textarea className="panel-input min-h-[92px]" placeholder="Cuándo usar" value={form.whenToUse} onChange={(event) => setForm((current) => ({ ...current, whenToUse: event.target.value }))} />
          <textarea className="panel-input min-h-[92px]" placeholder="Cuándo no usar" value={form.whenNotToUse} onChange={(event) => setForm((current) => ({ ...current, whenNotToUse: event.target.value }))} />
          <div className="flex flex-wrap gap-3">
            <Button type="submit">{editingSkillId ? 'Guardar cambios' : 'Crear capacidad'}</Button>
            <Button type="button" variant="secondary" onClick={resetForm}>Cancelar</Button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
}
