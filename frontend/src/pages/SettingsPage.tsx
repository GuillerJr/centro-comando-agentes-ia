import { useEffect, useState } from 'react';
import { commandCenterApi } from '../api/commandCenterApi';
import { DataTable, ErrorState, InfoPanel, LoadingState, PageShell, SectionCard } from '../components/ui';
import type { SystemSetting } from '../types/domain';

export function SettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    commandCenterApi.getSettings().then(setSettings).catch((reason) => setError(reason instanceof Error ? reason.message : 'No se pudo cargar la configuración.'));
  }, []);

  if (error) return <ErrorState message={error} />;
  if (!settings) return <LoadingState label="Cargando configuración..." />;

  return (
    <PageShell title="Settings" description="Parámetros operativos persistidos, configuración visible y preparación para auth, seguridad y modos de ejecución futuros.">
      <div className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <SectionCard title="Configuration table" subtitle="Vista principal de parámetros activos y su propósito operativo.">
          <DataTable
            columns={['Key', 'Category', 'Sensitive', 'Description']}
            rows={settings.map((setting) => [setting.setting_key, setting.category, setting.is_sensitive ? 'yes' : 'no', <div className="max-w-2xl text-sm leading-6 text-slate-600">{setting.description}</div>])}
          />
        </SectionCard>

        <div className="grid gap-4">
          <InfoPanel eyebrow="Persistence" title="Centralized settings" description="Los parámetros se mantienen en base de datos para conservar coherencia entre despliegues y reinicios." tone="default" />
          <InfoPanel eyebrow="Security" title="Sensitive fields identified" description="La UI distingue sensibilidad para preparar futuros controles de acceso y edición protegida." tone="warning" />
        </div>
      </div>
    </PageShell>
  );
}
