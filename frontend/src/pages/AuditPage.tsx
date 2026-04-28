import { useEffect, useState } from 'react';
import { commandCenterApi } from '../api/commandCenterApi';
import { DataTable, ErrorState, InfoPanel, LoadingState, PageShell, SectionCard, StatusBadge } from '../components/ui';
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
    <PageShell title="Audit logs" description="Registro estructurado de acciones, módulos impactados, resultado y severidad para seguimiento operativo y forense.">
      <div className="grid gap-6 xl:grid-cols-[1.22fr_0.78fr]">
        <SectionCard title="Audit register" subtitle="Tabla principal de auditoría con enfoque de lectura rápida y priorización de severidad.">
          <DataTable
            columns={['Actor', 'Action', 'Module', 'Result', 'Severity', 'Date']}
            rows={logs.map((log) => [
              log.actor,
              <div className="max-w-xs text-sm font-medium text-slate-800">{log.action}</div>,
              log.module_name,
              log.result_status,
              <StatusBadge status={log.severity} />,
              new Date(log.created_at).toLocaleString(),
            ])}
          />
        </SectionCard>

        <div className="grid gap-4">
          <InfoPanel eyebrow="Events" title={`${logs.length} records`} description="Volumen actual de eventos persistidos y visibles desde la UI del centro de comando." tone="default" />
          <InfoPanel eyebrow="Criticality" title={`${logs.filter((log) => log.severity === 'critical' || log.severity === 'error').length} high-severity`} description="Señales que merecen revisión más inmediata por su impacto operativo o técnico." tone="warning" />
          <InfoPanel eyebrow="Traceability" title="Centralized timeline" description="La auditoría funciona como registro de comportamiento del sistema, decisiones y efectos operativos." tone="success" />
        </div>
      </div>
    </PageShell>
  );
}
