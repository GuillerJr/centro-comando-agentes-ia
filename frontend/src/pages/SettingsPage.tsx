import { useEffect, useState } from 'react';
import { commandCenterApi } from '../api/commandCenterApi';
import { Button } from '../components/button';
import { Input } from '../components/input';
import { Modal } from '../components/modal';
import { ActionFeedback, DataTable, EmptyState, ErrorState, FormField, formatDisplayText, formatValue, LoadingState, PageShell, SectionCard, StatsGrid } from '../components/ui';
import type { SystemSetting } from '../types/domain';

type SettingForm = {
  settingKey: string;
  settingValue: string;
  category: 'openclaw' | 'mcp' | 'security' | 'ui' | 'runtime';
  isSensitive: boolean;
  description: string;
};

const defaultForm: SettingForm = {
  settingKey: '',
  settingValue: '',
  category: 'runtime',
  isSensitive: false,
  description: '',
};

function parseSettingValue(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function renderSettingValue(setting: SystemSetting) {
  if (setting.is_sensitive) return 'Valor oculto por seguridad';
  return formatValue(setting.setting_value);
}

export function SettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSettingId, setEditingSettingId] = useState<string | null>(null);
  const [form, setForm] = useState<SettingForm>(defaultForm);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSettings(await commandCenterApi.getSettings());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo cargar la configuración.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSettings();
  }, []);

  const resetForm = () => {
    setEditingSettingId(null);
    setForm(defaultForm);
    setModalOpen(false);
  };

  const openCreate = () => {
    setEditingSettingId(null);
    setForm(defaultForm);
    setModalOpen(true);
  };

  const openEdit = (setting: SystemSetting) => {
    setEditingSettingId(setting.id);
    setForm({
      settingKey: setting.setting_key,
      settingValue: typeof setting.setting_value === 'string' ? setting.setting_value : JSON.stringify(setting.setting_value, null, 2),
      category: setting.category as SettingForm['category'],
      isSensitive: setting.is_sensitive,
      description: setting.description,
    });
    setModalOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      setFeedback(null);
      const payload = {
        settingKey: form.settingKey,
        settingValue: parseSettingValue(form.settingValue),
        category: form.category,
        isSensitive: form.isSensitive,
        description: form.description,
      };
      if (editingSettingId) {
        await commandCenterApi.updateSetting(editingSettingId, payload);
        setFeedback('La configuración se actualizó correctamente.');
      } else {
        await commandCenterApi.createSetting(payload);
        setFeedback('La configuración se creó correctamente.');
      }
      resetForm();
      await loadSettings();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo guardar la configuración.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSensitive = async (setting: SystemSetting) => {
    try {
      setIsSubmitting(true);
      setError(null);
      setFeedback(null);
      await commandCenterApi.updateSettingVisibility(setting.id, !setting.is_sensitive);
      setFeedback(`La clave ${setting.setting_key} ahora ${!setting.is_sensitive ? 'se protege' : 'queda visible'} en la UI.`);
      await loadSettings();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo actualizar la visibilidad de la configuración.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error && isLoading) return <ErrorState message={error} action={<Button onClick={() => void loadSettings()}>Reintentar</Button>} />;
  if (isLoading) return <LoadingState label="Cargando configuración..." />;

  const policies = settings.filter((setting) => setting.setting_key.startsWith('politica.'));

  return (
    <PageShell title="Configuración" description="Parámetros operativos persistidos y ahora editables desde el centro de comando." action={<Button onClick={openCreate}>Crear clave</Button>}>
      {error ? <ActionFeedback tone="warning" message={error} /> : null}
      {feedback ? <ActionFeedback tone="success" message={feedback} /> : null}
      <StatsGrid
        className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
        items={[
          { eyebrow: 'Persistencia', title: `${settings.length} claves visibles`, description: 'Parámetros centralizados para sostener coherencia entre despliegues.', tone: 'default' },
          { eyebrow: 'Seguridad', title: `${settings.filter((setting) => setting.is_sensitive).length} sensibles`, description: 'Campos que conviene proteger con controles de acceso y edición restringida.', tone: 'warning' },
          { eyebrow: 'Categorías', title: `${new Set(settings.map((setting) => setting.category)).size} grupos`, description: 'Distribución funcional de la configuración disponible en la instancia.', tone: 'success' },
        ]}
      />

      <SectionCard title="Políticas base de misión" subtitle="Estas claves gobiernan riesgo, aprobación y bloqueo preventivo dentro de Mission Control. Si faltan, el backend crea automáticamente el set recomendado.">
        <DataTable
          columns={['Política', 'Valor', 'Lectura']}
          rows={(policies.length > 0 ? policies : [{ id: 'sin-politicas', setting_key: 'Sin políticas configuradas', setting_value: 'Usando defaults internos', category: 'security', is_sensitive: false, description: 'Mission Control usa aprobación por riesgo alto, bloqueo preventivo de shell y sandbox inicial.' } as SystemSetting]).map((setting) => [
            <span className="text-sm font-semibold text-white">{setting.setting_key}</span>,
            <span className="text-sm text-zinc-300">{renderSettingValue(setting)}</span>,
            <span className="text-sm text-zinc-400">{setting.description}</span>,
          ])}
        />
      </SectionCard>

      <div className="grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,1.2fr)_22rem]">
        <SectionCard title="Registro de configuración" subtitle="Tabla principal con edición y protección de visibilidad.">
          <DataTable
            columns={['Clave', 'Categoría', 'Valor', 'Protección', 'Acciones']}
            rows={settings.map((setting) => [
              <div><div className="text-sm font-medium text-white">{setting.setting_key}</div><div className="mt-1 text-xs text-zinc-500">{setting.description}</div></div>,
              formatDisplayText(setting.category),
              <div className="max-w-[18rem] whitespace-pre-wrap break-words font-mono text-xs leading-6 text-zinc-300">{renderSettingValue(setting)}</div>,
              <span className="text-sm text-zinc-300">{setting.is_sensitive ? 'Sensitiva' : 'Visible'}</span>,
              <div className="flex flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={() => openEdit(setting)}>Editar</Button><Button size="sm" variant="ghost" disabled={isSubmitting} onClick={() => void toggleSensitive(setting)}>{setting.is_sensitive ? 'Mostrar' : 'Proteger'}</Button></div>,
            ])}
          />
        </SectionCard>

        <SectionCard title="Notas de operación" subtitle="Resumen ejecutivo del bloque de configuración actual.">
          {settings[0] ? <DataTable
            columns={['Campo', 'Valor']}
            rows={[
              ['Última clave visible', <span className="text-sm font-medium text-white">{settings[0].setting_key}</span>],
              ['Categoría', formatDisplayText(settings[0].category)],
              ['Protección', settings[0].is_sensitive ? 'Requiere protección' : 'Visible'],
              ['Descripción', <div className="text-sm leading-6 text-zinc-400">{settings[0].description}</div>],
            ]}
          /> : <EmptyState title="Sin configuración destacada" description="Todavía no hay parámetros disponibles para construir notas operativas." />}
        </SectionCard>
      </div>

      <Modal open={modalOpen} onOpenChange={(open) => { if (!open) resetForm(); else setModalOpen(true); }} title={editingSettingId ? 'Editar configuración' : 'Crear configuración'} description="Define clave, valor, categoría y política de visibilidad.">
        <form className="space-y-4" onSubmit={submit}>
          <FormField label="Clave"><Input value={form.settingKey} onChange={(event) => setForm((current) => ({ ...current, settingKey: event.target.value }))} /></FormField>
          <FormField label="Valor JSON o texto"><textarea className="panel-input min-h-[140px]" value={form.settingValue} onChange={(event) => setForm((current) => ({ ...current, settingValue: event.target.value }))} /></FormField>
          <FormField label="Categoría"><select className="panel-input" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as SettingForm['category'] }))}><option value="openclaw">openclaw</option><option value="mcp">mcp</option><option value="security">security</option><option value="ui">ui</option><option value="runtime">runtime</option></select></FormField>
          <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-zinc-200"><input type="checkbox" checked={form.isSensitive} onChange={(event) => setForm((current) => ({ ...current, isSensitive: event.target.checked }))} />Valor sensible</label>
          <FormField label="Descripción"><Input value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></FormField>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : editingSettingId ? 'Guardar cambios' : 'Crear configuración'}</Button>
        </form>
      </Modal>
    </PageShell>
  );
}
