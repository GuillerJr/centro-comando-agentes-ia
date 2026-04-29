import { useEffect, useState } from 'react';
import { commandCenterApi } from '../api/commandCenterApi';
import { DataTable, ErrorState, formatDisplayText, LoadingState, PageShell, SectionCard, StatsGrid, StatusBadge } from '../components/ui';
import type { AuditLog } from '../types/domain';

export function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    commandCenterApi.getAuditLogs().then(setLogs).catch((reason) => setError(reason instanceof Error ? reason.message : 'No se pudo cargar la auditoría.'));
  }, []);

  if (error) return <ErrorState message={error} />;
  if (!logs) return <LoadingState label="Cargando auditoría..." />;

  return (
    <PageShell title="Auditoría" description="Registro estructurado de acciones, módulos impactados, resultado y severidad para seguimiento operativo y forense.">
      <StatsGrid
        className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
        items={[
          { eyebrow: 'Eventos', title: `${logs.length} registros`, description: 'Volumen actual de eventos persistidos y visibles en el centro de comando.', tone: 'default' },
          { eyebrow: 'Criticidad', title: `${logs.filter((log) => log.severity === 'critical' || log.severity === 'error').length} severos`, description: 'Señales que merecen revisión más inmediata por su impacto operativo o técnico.', tone: 'warning' },
          { eyebrow: 'Trazabilidad', title: 'Línea temporal centralizada', description: 'La auditoría consolida comportamiento del sistema, decisiones y efectos operativos.', tone: 'success' },
        ]}
      />

      <div className="grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,1.24fr)_22rem]">
        <SectionCard title="Registro de auditoría" subtitle="Tabla principal de auditoría con enfoque de lectura rápida y priorización de severidad.">
          <DataTable
            columns={['Actor', 'Acción', 'Módulo', 'Resultado', 'Severidad', 'Fecha']}
            rows={logs.map((log) => [
              <div className="text-sm text-zinc-300">{log.actor}</div>,
              <div className="text-sm font-medium text-white">{log.action}</div>,
              <div className="text-sm text-zinc-300">{log.module_name}</div>,
              <div className="text-sm text-zinc-300">{formatDisplayText(log.result_status)}</div>,
              <StatusBadge status={log.severity} />,
              <div className="text-sm text-zinc-400">{new Date(log.created_at).toLocaleString()}</div>,
            ])}
          />
        </SectionCard>

        <SectionCard title="Lectura rápida" subtitle="Puntos de interpretación para separar ruido de eventos relevantes.">
          <div className="space-y-3">
            <div className="surface-muted p-4 text-sm leading-6 text-zinc-300">Cruza actor, módulo y resultado para detectar patrones repetidos antes de escalar un incidente.</div>
            <div className="surface-muted p-4 text-sm leading-6 text-zinc-300">Las severidades altas concentran primero la atención; los eventos informativos ayudan a reconstruir secuencia.</div>
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
