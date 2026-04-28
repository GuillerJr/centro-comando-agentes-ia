import { useEffect, useState } from 'react';
import { commandCenterApi } from '../api/commandCenterApi';
import { ApprovalPanel, DataTable, ErrorState, InfoPanel, LoadingState, MetricPill, PageShell, SectionCard, StatusBadge } from '../components/ui';
import type { Approval } from '../types/domain';

export function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadApprovals = async () => {
    try {
      setApprovals(await commandCenterApi.getApprovals());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudieron cargar las aprobaciones.');
    }
  };

  useEffect(() => { void loadApprovals(); }, []);

  const handleDecision = async (approvalId: string, decision: 'approve' | 'reject') => {
    if (decision === 'approve') {
      await commandCenterApi.approveApproval(approvalId, { reviewedBy: 'Guiller', executionNotes: 'Aprobado desde UI' });
    } else {
      await commandCenterApi.rejectApproval(approvalId, { reviewedBy: 'Guiller', executionNotes: 'Rechazado desde UI' });
    }
    await loadApprovals();
  };

  if (error) return <ErrorState message={error} />;
  if (!approvals) return <LoadingState label="Cargando aprobaciones..." />;

  const pendingCount = approvals.filter((approval) => approval.status === 'pending').length;

  return (
    <PageShell title="Approvals" description="Centro de decisión para acciones sensibles, cambios de configuración y operaciones con impacto de riesgo." action={<MetricPill label="Pending" value={String(pendingCount)} tone={pendingCount > 0 ? 'info' : 'success'} />}>
      <div className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <ApprovalPanel>
          <DataTable
            columns={['Type', 'Requested by', 'Status', 'Reason', 'Actions']}
            rows={approvals.map((approval) => [
              approval.approval_type,
              approval.requested_by,
              <StatusBadge status={approval.status} />,
              <div className="max-w-md text-sm leading-6 text-slate-600">{approval.reason}</div>,
              approval.status === 'pending'
                ? <div className="flex flex-wrap gap-2"><button className="rounded-2xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white" onClick={() => void handleDecision(approval.id, 'approve')}>Approve</button><button className="rounded-2xl bg-rose-500 px-3 py-2 text-xs font-semibold text-white" onClick={() => void handleDecision(approval.id, 'reject')}>Reject</button></div>
                : 'Resolved',
            ])}
          />
        </ApprovalPanel>

        <div className="grid gap-4">
          <InfoPanel eyebrow="Risk" title="Decision before execution" description="Las acciones sensibles exigen aprobación explícita antes de pasar a ejecución efectiva." tone="warning" />
          <InfoPanel eyebrow="Traceability" title="Persisted review history" description="El sistema mantiene solicitante, motivo, payload resumido y decisión final para auditoría." tone="default" />
          <InfoPanel eyebrow="Separation" title="UI decides, backend records" description="La capa visual no ejecuta acciones críticas de forma directa; solo gobierna el flujo de decisión." tone="success" />
        </div>
      </div>
    </PageShell>
  );
}
