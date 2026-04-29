import { useEffect, useState } from 'react';
import { commandCenterApi } from '../api/commandCenterApi';
import { Button } from '../components/button';
import { ActionFeedback, DataTable, EmptyState, ErrorState, formatDisplayText, formatValue, LoadingState, MetricPill, PageShell, SectionCard, StatsGrid, StatusBadge } from '../components/ui';
import type { Approval } from '../types/domain';

export function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

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

  const pendingCount = approvals.filter((approval) => approval.status === 'pending').length;
  const latestApproval = approvals[0];

  return (
    <PageShell
      title="Aprobaciones"
      description="Punto de control para operaciones sensibles, decisiones manuales y cierre operativo explícito."
      action={<MetricPill label="Pendientes" value={String(pendingCount)} tone={pendingCount > 0 ? 'info' : 'success'} />}
    >
      {actionError ? <ActionFeedback tone="warning" message={actionError} /> : null}
      {feedback ? <ActionFeedback tone="success" message={feedback} /> : null}
      <StatsGrid
        className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
        items={[
          { eyebrow: 'Pendientes', title: `${pendingCount} por resolver`, description: 'Solicitudes sensibles esperando decisión humana explícita.', tone: pendingCount > 0 ? 'warning' : 'success' },
          { eyebrow: 'Resueltas', title: `${approvals.filter((approval) => approval.status !== 'pending').length} cerradas`, description: 'Aprobaciones que ya cuentan con resolución trazable.', tone: 'default' },
          { eyebrow: 'Gobernanza', title: 'Control humano activo', description: 'La operación mantiene una puerta manual antes de ejecutar acciones sensibles.', tone: 'success' },
        ]}
      />

      <div className="grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,1.2fr)_22rem]">
        <SectionCard title="Bandeja de aprobaciones" subtitle="Gestión de aprobar, rechazar y ejecutar desde tabla compacta.">
          <DataTable
            columns={['Tipo', 'Solicitado por', 'Estado', 'Motivo', 'Payload', 'Acciones']}
            rows={approvals.map((approval) => [
              <div className="text-sm font-medium text-white">{formatDisplayText(approval.approval_type)}</div>,
              <div className="text-sm text-zinc-300">{approval.requested_by}</div>,
              <StatusBadge status={approval.status} />,
              <div className="text-sm leading-6 text-zinc-400">{approval.reason}</div>,
              <pre className="max-w-[16rem] overflow-x-auto whitespace-pre-wrap text-[11px] text-zinc-500">{formatValue(approval.payload_summary)}</pre>,
              approval.status === 'pending' ? <div className="flex flex-wrap gap-2"><Button size="sm" variant="success" disabled={processingId === approval.id} onClick={() => void handleDecision(approval, 'approve')}>Aprobar</Button><Button size="sm" variant="danger" disabled={processingId === approval.id} onClick={() => void handleDecision(approval, 'reject')}>Rechazar</Button></div> : approval.status === 'approved' ? <Button size="sm" variant="secondary" disabled={processingId === approval.id} onClick={() => void handleDecision(approval, 'execute')}>Ejecutar</Button> : <span className="text-xs uppercase tracking-[0.16em] text-zinc-500">Cerrada</span>,
            ])}
          />
        </SectionCard>

        <SectionCard title="Marco operativo" subtitle="Resumen del último registro visible con su contexto de control.">
          {latestApproval ? <DataTable
            columns={['Campo', 'Valor']}
            rows={[
              ['Último tipo', formatDisplayText(latestApproval.approval_type)],
              ['Solicitante', latestApproval.requested_by],
              ['Estado', <StatusBadge status={latestApproval.status} />],
              ['Notas', <div className="text-sm leading-6 text-zinc-400">{latestApproval.execution_notes ?? 'Sin notas todavía'}</div>],
              ['Payload', <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-zinc-300">{formatValue(latestApproval.payload_summary)}</pre>],
            ]}
          /> : <EmptyState title="Sin aprobaciones recientes" description="Todavía no hay solicitudes para resumir en este panel lateral." />}
        </SectionCard>
      </div>
    </PageShell>
  );
}
