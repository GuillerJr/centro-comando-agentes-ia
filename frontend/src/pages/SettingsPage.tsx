import { useEffect, useState } from 'react';
import { commandCenterApi } from '../api/commandCenterApi';
import { DataTable, ErrorState, LoadingState, PageShell, SectionCard, StatsGrid } from '../components/ui';
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
            columns={['Clave', 'Categoría', 'Sensitivo', 'Descripción']}
            rows={settings.map((setting) => [
              <div className="text-sm font-medium text-white">{setting.setting_key}</div>,
              <div className="text-sm text-zinc-300">{setting.category}</div>,
              <div className="text-sm text-zinc-300">{setting.is_sensitive ? 'sí' : 'no'}</div>,
              <div className="text-sm leading-6 text-zinc-400">{setting.description}</div>,
            ])}
          />
        </SectionCard>

        <SectionCard title="Notas de operación" subtitle="Lectura práctica para gobernar la configuración sin perder contexto.">
          <div className="space-y-3">
            <div className="surface-muted p-4 text-sm leading-6 text-zinc-300">La configuración está centralizada para mantener una base consistente entre reinicios y despliegues.</div>
            <div className="surface-muted p-4 text-sm leading-6 text-zinc-300">Los campos sensibles ya se distinguen visualmente para preparar una futura edición protegida.</div>
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
