import { useEffect, useState } from 'react';
import { commandCenterApi } from '../api/commandCenterApi';
import { DataTable, ErrorState, InfoPanel, LoadingState, PageShell, SectionCard, StatusBadge } from '../components/ui';
import type { Skill } from '../types/domain';
import { skillFormSchema } from '../utils/validation';

export function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ canonicalName: '', description: '', skillType: 'operations', whenToUse: '', whenNotToUse: '' });
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);

  const loadSkills = async () => {
    try {
      setSkills(await commandCenterApi.getSkills());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudieron cargar las skills.');
    }
  };

  useEffect(() => { void loadSkills(); }, []);

  const resetForm = () => {
    setForm({ canonicalName: '', description: '', skillType: 'operations', whenToUse: '', whenNotToUse: '' });
    setEditingSkillId(null);
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
  };

  if (error) return <ErrorState message={error} />;
  if (!skills) return <LoadingState label="Cargando skills..." />;

  return (
    <PageShell title="Skills registry" description="Catálogo gobernado de skills con criterios de uso, restricciones y calidad visible en formato más operativo.">
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <SectionCard title="Skills inventory" subtitle="Vista tipo registro para revisar el catálogo sin depender de cards sueltas.">
          <DataTable
            columns={['Canonical', 'Type', 'Status', 'When to use', 'Actions']}
            rows={skills.map((skill) => [
              <div className="max-w-xs"><p className="text-sm font-semibold text-slate-800">{skill.canonical_name}</p><p className="mt-1 text-xs text-slate-400">{skill.conversational_alias ?? 'sin alias'}</p></div>,
              skill.skill_type,
              <StatusBadge status={skill.status} />,
              <div className="max-w-md text-sm leading-6 text-slate-600">{skill.when_to_use}</div>,
              <button className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600" onClick={() => startEdit(skill)}>Editar</button>,
            ])}
          />
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title={editingSkillId ? 'Editar skill' : 'Registrar skill'} subtitle="Panel lateral de mantenimiento de la taxonomía y el criterio de uso.">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <input className="panel-input" placeholder="Nombre canónico" value={form.canonicalName} onChange={(event) => setForm((current) => ({ ...current, canonicalName: event.target.value }))} />
              <textarea className="panel-input" rows={3} placeholder="Descripción" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
              <select className="panel-input" value={form.skillType} onChange={(event) => setForm((current) => ({ ...current, skillType: event.target.value }))}>
                <option value="governance">governance</option>
                <option value="architecture">architecture</option>
                <option value="frontend">frontend</option>
                <option value="backend">backend</option>
                <option value="database">database</option>
                <option value="mcp">mcp</option>
                <option value="ui">ui</option>
                <option value="fullstack">fullstack</option>
                <option value="operations">operations</option>
              </select>
              <textarea className="panel-input" rows={3} placeholder="Cuándo usarla" value={form.whenToUse} onChange={(event) => setForm((current) => ({ ...current, whenToUse: event.target.value }))} />
              <textarea className="panel-input" rows={3} placeholder="Cuándo no usarla" value={form.whenNotToUse} onChange={(event) => setForm((current) => ({ ...current, whenNotToUse: event.target.value }))} />
              <div className="flex flex-wrap gap-3">
                <button className="rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white" type="submit">{editingSkillId ? 'Guardar cambios' : 'Registrar skill'}</button>
                {editingSkillId ? <button className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-600" type="button" onClick={resetForm}>Cancelar</button> : null}
              </div>
            </form>
          </SectionCard>

          <div className="grid gap-4">
            <InfoPanel eyebrow="Governance" title={`${skills.length} skills visibles`} description="Inventario total de skills gobernadas actualmente por el centro de comando." tone="default" />
            <InfoPanel eyebrow="Structure" title="Menos cards, más registro" description="Se prioriza lectura compacta y mantenimiento operativo en vez de composición ornamental." tone="success" />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
