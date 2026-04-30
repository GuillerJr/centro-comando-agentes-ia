import { useEffect, useState } from 'react';
import { commandCenterApi } from '../api/commandCenterApi';
import { Button } from '../components/button';
import { Input } from '../components/input';
import { ActionFeedback, DataTable, EmptyState, ErrorState, formatDisplayText, formatValue, LoadingState, MetricPill, PageShell, SectionCard, StatsGrid, StatusBadge } from '../components/ui';
import type { Approval } from '../types/domain';

export function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadApprovals = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      setApprovals(await commandCenterApi.getApprovals());
    } catch (reason) {
      setLoadError(reason instanceof Error ? reason.message : 'No se pudieron cargar las aprobaciones.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadApprovals();
  }, []);

  const handleDecision = async (approval: Approval, decision: 'approve' | 'reject' | 'execute') => {
    try {
      setProcessingId(approval.id);
      setActionError(null);
      setFeedback(null);
      const payload = { reviewedBy: 'Guiller', executionNotes: decision === 'execute' ? 'Ejecutado desde UI' : decision === 'approve' ? 'Aprobado desde UI' : 'Rechazado desde UI' };
      if (decision === 'approve') {
        await commandCenterApi.approveApproval(approval.id, payload);
        setFeedback('La aprobación se marcó como aprobada.');
      } else if (decision === 'reject') {
        await commandCenterApi.rejectApproval(approval.id, payload);
        setFeedback('La aprobación se marcó como rechazada.');
      } else {
        await commandCenterApi.executeApproval(approval.id, payload);
        setFeedback('La aprobación se marcó como ejecutada.');
      }
      await loadApprovals();
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : 'No se pudo registrar la decisión.');
    } finally {
      setProcessingId(null);
    }
  };

  if (loadError) return <ErrorState message={loadError} action={<Button onClick={() => void loadApprovals()}>Reintentar</Button>} />;
  if (isLoading) return <LoadingState label="Cargando aprobaciones..." />;

  const filteredApprovals = approvals.filter((approval) => {
    const matchesSearch = `${approval.approval_type} ${approval.requested_by} ${approval.reason} ${approval.mission_title ?? ''} ${approval.task_title ?? ''}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || approval.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const pendingCount = approvals.filter((approval) => approval.status === 'pending').length;
  const criticalApprovals = approvals.filter((approval) => String(approval.payload_summary?.riskLevel ?? '') === 'critical').length;
  const realModeApprovals = approvals.filter((approval) => approval.payload_summary?.sandbox === false).length;
  const latestApproval = filteredApprovals[0] ?? approvals[0];

  return (
    <PageShell
      title="Aprobaciones"
      description="Punto de control para operaciones sensibles, decisiones manuales y cierre operativo explícito."
      action={<MetricPill label="Pendientes" value={String(pendingCount)} tone={pendingCount > 0 ? 'info' : 'success'} />}
    >
      {actionError ? <ActionFeedback tone="warning" message={actionError} /> : null}
      {feedback ? <ActionFeedback tone="success" message={feedback} /> : null}
      <StatsGrid
        className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
        items={[
          { eyebrow: 'Pendientes', title: `${pendingCount} por resolver`, description: 'Solicitudes sensibles esperando decisión humana explícita.', tone: pendingCount > 0 ? 'warning' : 'success' },
          { eyebrow: 'Resueltas', title: `${approvals.filter((approval) => approval.status !== 'pending').length} cerradas`, description: 'Aprobaciones que ya cuentan con resolución trazable.', tone: 'default' },
          { eyebrow: 'Misiones críticas', title: `${approvals.filter((approval) => String(approval.payload_summary?.riskLevel ?? '') === 'critical').length}`, description: 'Aprobaciones ligadas a misiones de riesgo crítico.', tone: 'danger' },
          { eyebrow: 'Gobernanza', title: 'Control humano activo', description: 'La operación mantiene una puerta manual antes de ejecutar acciones sensibles.', tone: 'success' },
        ]}
      />

      <SectionCard title="Señales de seguridad" subtitle="Lectura rápida para saber qué tan expuesta está la operación antes de aprobar o ejecutar.">
        <DataTable
          columns={['Señal', 'Valor', 'Lectura']}
          rows={[
            ['Pendientes de riesgo crítico', criticalApprovals, 'Aprobaciones que merecen máxima cautela antes de desbloquear ejecución.'],
            ['Modo real visible', realModeApprovals, 'Solicitudes que apuntan a ejecución real y no a simulación segura.'],
            ['Pendientes sin resolver', pendingCount, 'Cola actual que sigue esperando decisión del operador.'],
          ]}
        />
      </SectionCard>

      <div className="grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,1.2fr)_22rem]">
        <SectionCard title="Bandeja de aprobaciones" subtitle="Gestión de aprobar, rechazar y ejecutar desde tabla compacta.">
          <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
            <Input placeholder="Buscar aprobación..." value={search} onChange={(event) => setSearch(event.target.value)} />
            <select className="panel-input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">todos los estados</option><option value="pending">pending</option><option value="approved">approved</option><option value="rejected">rejected</option><option value="executed">executed</option></select>
          </div>
          <DataTable
            columns={['Tipo', 'Misión', 'Estado', 'Motivo', 'Impacto', 'Acciones']}
            rows={filteredApprovals.map((approval) => [
              <div className="text-sm font-medium text-white">{formatDisplayText(approval.approval_type)}</div>,
              <div><div className="text-sm text-zinc-300">{approval.mission_title ?? 'Sin misión enlazada'}</div><div className="mt-1 text-xs text-zinc-500">{approval.task_title ?? approval.requested_by}</div></div>,
              <StatusBadge status={approval.status} />,
              <div className="text-sm leading-6 text-zinc-400">{approval.reason}</div>,
              <div className="max-w-[16rem] text-xs leading-6 text-zinc-400"><p>Riesgo: {formatDisplayText(String(approval.payload_summary?.riskLevel ?? 'medium'))}</p><p>Modo: {approval.payload_summary?.sandbox ? 'simulación segura' : 'ejecución real'}</p><p>Acciones: {Array.isArray(approval.payload_summary?.sensitiveActions) ? approval.payload_summary.sensitiveActions.length : 0}</p></div>,
              approval.status === 'pending' ? <div className="flex flex-wrap gap-2"><Button size="sm" variant="success" disabled={processingId === approval.id} onClick={() => void handleDecision(approval, 'approve')}>Aprobar</Button><Button size="sm" variant="danger" disabled={processingId === approval.id} onClick={() => void handleDecision(approval, 'reject')}>Rechazar</Button></div> : approval.status === 'approved' ? <Button size="sm" variant="secondary" disabled={processingId === approval.id} onClick={() => void handleDecision(approval, 'execute')}>Ejecutar</Button> : <span className="text-xs uppercase tracking-[0.16em] text-zinc-500">Cerrada</span>,
            ])}
          />
        </SectionCard>

        <SectionCard title="Marco operativo" subtitle="Resumen del último registro visible con su contexto de control.">
          {latestApproval ? <DataTable
            columns={['Campo', 'Valor']}
            rows={[
              ['Último tipo', formatDisplayText(latestApproval.approval_type)],
              ['Misión', latestApproval.mission_title ?? 'Sin misión enlazada'],
              ['Solicitante', latestApproval.requested_by],
              ['Estado', <StatusBadge status={latestApproval.status} />],
              ['Estado de misión', latestApproval.mission_status ? <StatusBadge status={latestApproval.mission_status} /> : 'Sin misión'],
              ['Notas', <div className="text-sm leading-6 text-zinc-400">{latestApproval.execution_notes ?? 'Sin notas todavía'}</div>],
              ['Impacto', <div className="text-sm leading-6 text-zinc-300">Riesgo {formatDisplayText(String(latestApproval.payload_summary?.riskLevel ?? 'medium'))}, modo {latestApproval.payload_summary?.sandbox ? 'simulación segura' : 'ejecución real'} y {Array.isArray(latestApproval.payload_summary?.sensitiveActions) ? latestApproval.payload_summary.sensitiveActions.length : 0} acciones sensibles detectadas.</div>],
              ['Permisos requeridos', <div className="text-sm leading-6 text-zinc-300">{Array.isArray(latestApproval.payload_summary?.requiredPermissions) && latestApproval.payload_summary.requiredPermissions.length > 0 ? latestApproval.payload_summary.requiredPermissions.join(', ') : 'Sin permisos especiales declarados.'}</div>],
              ['Payload', <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-zinc-300">{formatValue(latestApproval.payload_summary)}</pre>],
            ]}
          /> : <EmptyState title="Sin aprobaciones recientes" description="Todavía no hay solicitudes para resumir en este panel lateral." />}
        </SectionCard>
      </div>
    </PageShell>
  );
}
