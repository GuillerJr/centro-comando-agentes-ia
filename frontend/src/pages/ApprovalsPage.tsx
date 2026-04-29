import { useEffect, useState } from 'react';
import { commandCenterApi } from '../api/commandCenterApi';
import { Button } from '../components/button';
import { ApprovalPanel, DataTable, ErrorState, LoadingState, MetricPill, PageShell, StatsGrid, StatusBadge } from '../components/ui';
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

  useEffect(() => {
    void loadApprovals();
  }, []);

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
    <PageShell
      title="Aprobaciones"
      description="Punto de control para operaciones sensibles, decisiones manuales y trazabilidad explícita."
      action={<MetricPill label="Pendientes" value={String(pendingCount)} tone={pendingCount > 0 ? 'info' : 'success'} />}
    >
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
              <div className="text-sm font-medium text-white">{approval.approval_type}</div>,
              <div className="text-sm text-zinc-300">{approval.requested_by}</div>,
              <StatusBadge status={approval.status} />,
              <div className="text-sm leading-6 text-zinc-400">{approval.reason}</div>,
              approval.status === 'pending' ? (
                <div className="flex w-full min-w-0 flex-col gap-2">
                  <Button size="sm" variant="success" fullWidth onClick={() => void handleDecision(approval.id, 'approve')}>
                    Aprobar
                  </Button>
                  <Button size="sm" variant="danger" fullWidth onClick={() => void handleDecision(approval.id, 'reject')}>
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
            <div className="space-y-3">
              <div className="surface-muted p-4 text-sm leading-6 text-zinc-300">Las acciones sensibles no pasan directamente a ejecución sin validación explícita.</div>
              <div className="surface-muted p-4 text-sm leading-6 text-zinc-300">Cada aprobación conserva solicitante, motivo y resolución para revisión posterior.</div>
              <div className="surface-muted p-4 text-sm leading-6 text-zinc-300">La interfaz gobierna el flujo de decisión, no dispara operaciones críticas por sí sola.</div>
            </div>
          </div>
        </ApprovalPanel>
      </div>
    </PageShell>
  );
}
