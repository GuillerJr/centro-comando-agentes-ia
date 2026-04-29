import { useEffect, useState } from 'react';
import { commandCenterApi } from '../api/commandCenterApi';
import { Button } from '../components/button';
import { Input } from '../components/input';
import { DataTable, EmptyState, ErrorState, formatDateTime, formatDisplayText, LoadingState, PageShell, SectionCard, StatsGrid, StatusBadge } from '../components/ui';
import type { AuditLog } from '../types/domain';

export function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setLogs(await commandCenterApi.getAuditLogs());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo cargar la auditoría.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadLogs();
  }, []);

  if (error) return <ErrorState message={error} action={<Button onClick={() => void loadLogs()}>Reintentar</Button>} />;
  if (isLoading) return <LoadingState label="Cargando auditoría..." />;

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = `${log.actor} ${log.action} ${log.module_name}`.toLowerCase().includes(search.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });
  const topIssue = filteredLogs.find((log) => log.severity === 'critical' || log.severity === 'error') ?? filteredLogs[0] ?? logs[0];

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
          <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
            <Input placeholder="Buscar evento..." value={search} onChange={(event) => setSearch(event.target.value)} />
            <select className="panel-input" value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)}><option value="all">todas las severidades</option><option value="info">info</option><option value="warning">warning</option><option value="error">error</option><option value="critical">critical</option></select>
          </div>
          <DataTable
            columns={['Actor', 'Acción', 'Módulo', 'Resultado', 'Severidad', 'Fecha']}
            rows={filteredLogs.map((log) => [
              <div className="text-sm text-zinc-300">{log.actor}</div>,
              <div className="text-sm font-medium text-white">{log.action}</div>,
              <div className="text-sm text-zinc-300">{log.module_name}</div>,
              <div className="text-sm text-zinc-300">{formatDisplayText(log.result_status)}</div>,
              <StatusBadge status={log.severity} />,
              <div className="text-sm text-zinc-400">{formatDateTime(log.created_at)}</div>,
            ])}
          />
        </SectionCard>

        <SectionCard title="Lectura rápida" subtitle="Puntos de interpretación para separar ruido de eventos relevantes.">
          {topIssue ? <DataTable
            columns={['Campo', 'Valor']}
            rows={[
              ['Evento a revisar', topIssue.action],
              ['Módulo', topIssue.module_name],
              ['Actor', topIssue.actor],
              ['Severidad', <StatusBadge status={topIssue.severity} />],
              ['Fecha', formatDateTime(topIssue.created_at)],
            ]}
          /> : <EmptyState title="Sin eventos destacados" description="Todavía no hay registros para construir una lectura rápida de auditoría." />}
        </SectionCard>
      </div>
    </PageShell>
  );
}
