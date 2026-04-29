import { useEffect, useState } from 'react';
import { commandCenterApi } from '../api/commandCenterApi';
import { Button } from '../components/button';
import { ActionFeedback, ApprovalPanel, DataTable, DetailList, EmptyState, ErrorState, formatDisplayText, formatValue, LoadingState, MetricPill, PageShell, StatsGrid, StatusBadge } from '../components/ui';
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

  const handleDecision = async (approvalId: string, decision: 'approve' | 'reject') => {
    try {
      setProcessingId(approvalId);
      setActionError(null);
      setFeedback(null);
      if (decision === 'approve') {
        await commandCenterApi.approveApproval(approvalId, { reviewedBy: 'Guiller', executionNotes: 'Aprobado desde UI' });
        setFeedback('La aprobación se marcó como aprobada.');
      } else {
        await commandCenterApi.rejectApproval(approvalId, { reviewedBy: 'Guiller', executionNotes: 'Rechazado desde UI' });
        setFeedback('La aprobación se marcó como rechazada.');
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
      description="Punto de control para operaciones sensibles, decisiones manuales y trazabilidad explícita."
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
        <ApprovalPanel>
          <DataTable
            columns={['Tipo', 'Solicitado por', 'Estado', 'Motivo', 'Acciones']}
            rows={approvals.map((approval) => [
              <div className="text-sm font-medium text-white">{formatDisplayText(approval.approval_type)}</div>,
              <div className="text-sm text-zinc-300">{approval.requested_by}</div>,
              <StatusBadge status={approval.status} />,
              <div className="text-sm leading-6 text-zinc-400">{approval.reason}</div>,
              approval.status === 'pending' ? (
                <div className="flex w-full min-w-0 flex-col gap-2">
                  <Button size="sm" variant="success" fullWidth disabled={processingId === approval.id} onClick={() => void handleDecision(approval.id, 'approve')}>
                    Aprobar
                  </Button>
                  <Button size="sm" variant="danger" fullWidth disabled={processingId === approval.id} onClick={() => void handleDecision(approval.id, 'reject')}>
                    Rechazar
                  </Button>
                </div>
              ) : (
                <span className="text-xs uppercase tracking-[0.16em] text-zinc-500">Resuelta</span>
              ),
            ])}
          />
        </ApprovalPanel>

        <ApprovalPanel>
          <div className="space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Marco operativo</p>
            {latestApproval ? (
              <DetailList
                items={[
                  { label: 'Último tipo', value: formatDisplayText(latestApproval.approval_type) },
                  { label: 'Solicitante', value: latestApproval.requested_by },
                  { label: 'Estado', value: <StatusBadge status={latestApproval.status} /> },
                  { label: 'Payload', value: <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-zinc-300">{formatValue(latestApproval.payload_summary)}</pre> },
                ]}
              />
            ) : <EmptyState title="Sin aprobaciones recientes" description="Todavía no hay solicitudes para resumir en este panel lateral." />}
          </div>
        </ApprovalPanel>
      </div>
    </PageShell>
  );
}
