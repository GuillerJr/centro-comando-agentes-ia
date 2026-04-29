import { useEffect, useState } from 'react';
import { commandCenterApi } from '../api/commandCenterApi';
import { Button } from '../components/button';
import { DataTable, DetailList, EmptyState, ErrorState, formatDisplayText, formatValue, LoadingState, PageShell, SectionCard, StatsGrid } from '../components/ui';
import type { SystemSetting } from '../types/domain';

function renderSettingValue(setting: SystemSetting) {
  if (setting.is_sensitive) return 'Valor oculto por seguridad';
  return formatValue(setting.setting_value);
}

export function SettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (error) return <ErrorState message={error} action={<Button onClick={() => void loadSettings()}>Reintentar</Button>} />;
  if (isLoading) return <LoadingState label="Cargando configuración..." />;

  const latestSensitiveSetting = settings.find((setting) => setting.is_sensitive) ?? settings[0];

  return (
    <PageShell title="Configuración" description="Parámetros operativos persistidos y base de configuración del entorno de control.">
      <StatsGrid
        className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
        items={[
          { eyebrow: 'Persistencia', title: `${settings.length} claves visibles`, description: 'Parámetros centralizados para sostener coherencia entre despliegues.', tone: 'default' },
          { eyebrow: 'Seguridad', title: `${settings.filter((setting) => setting.is_sensitive).length} sensibles`, description: 'Campos que conviene proteger con controles de acceso y edición restringida.', tone: 'warning' },
          { eyebrow: 'Categorías', title: `${new Set(settings.map((setting) => setting.category)).size} grupos`, description: 'Distribución funcional de la configuración disponible en la instancia.', tone: 'success' },
        ]}
      />

      <div className="grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,1.18fr)_22rem]">
        <SectionCard title="Registro de configuración" subtitle="Tabla principal de parámetros activos y su contexto operativo.">
          <DataTable
            columns={['Clave', 'Categoría', 'Valor', 'Sensitivo', 'Descripción']}
            rows={settings.map((setting) => [
              <div className="text-sm font-medium text-white">{setting.setting_key}</div>,
              <div className="text-sm text-zinc-300">{formatDisplayText(setting.category)}</div>,
              <div className="max-w-[20rem] whitespace-pre-wrap break-words font-mono text-xs leading-6 text-zinc-300">{renderSettingValue(setting)}</div>,
              <div className="text-sm text-zinc-300">{setting.is_sensitive ? 'Sí' : 'No'}</div>,
              <div className="text-sm leading-6 text-zinc-400">{setting.description}</div>,
            ])}
          />
        </SectionCard>

        <SectionCard title="Notas de operación" subtitle="Lectura práctica para gobernar la configuración sin perder contexto.">
          {latestSensitiveSetting ? <DetailList items={[{ label: 'Clave destacada', value: latestSensitiveSetting.setting_key }, { label: 'Categoría', value: formatDisplayText(latestSensitiveSetting.category) }, { label: 'Sensibilidad', value: latestSensitiveSetting.is_sensitive ? 'Requiere protección' : 'Visible' }, { label: 'Descripción', value: latestSensitiveSetting.description }]} /> : <EmptyState title="Sin configuración destacada" description="Todavía no hay parámetros disponibles para construir notas operativas." />}
        </SectionCard>
      </div>
    </PageShell>
  );
}
