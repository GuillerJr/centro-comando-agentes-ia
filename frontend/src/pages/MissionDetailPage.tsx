import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { commandCenterApi } from '../api/commandCenterApi';
import { Button } from '../components/button';
import { Input } from '../components/input';
import { ActionFeedback, ChipGroup, DataTable, ErrorState, FormField, LoadingState, PageShell, SectionCard, StatusBadge } from '../components/ui';
import type { Mission } from '../types/domain';

export function MissionDetailPage() {
  const { missionId } = useParams();
  const navigate = useNavigate();
  const [mission, setMission] = useState<Mission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Carga la misión con toda su planificación para permitir revisión humana.
  const loadMission = async () => {
    if (!missionId) return;
    try {
      setIsLoading(true);
      setError(null);
      setMission(await commandCenterApi.getMissionById(missionId));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo cargar la misión.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadMission();
  }, [missionId]);

  // Actualiza cualquier campo editable del plan sin perder el resto del contexto.
  const updateMissionField = <K extends keyof Mission>(key: K, value: Mission[K]) => {
    setMission((current) => (current ? { ...current, [key]: value } : current));
  };

  // Persiste el plan completo para que el operador lo deje listo antes de iniciar.
  const handleSave = async () => {
    if (!missionId || !mission) return;
    try {
      setIsSaving(true);
      setError(null);
      setFeedback(null);
      await commandCenterApi.updateMission(missionId, {
        title: mission.title,
        description: mission.description,
        objective: mission.objective,
        status: mission.status,
        priority: mission.priority,
        riskLevel: mission.risk_level,
        assignedAgentId: mission.assigned_agent_id ?? null,
        createdBy: mission.created_by,
        summary: mission.summary,
        estimatedSteps: mission.estimated_steps,
        requiresApproval: mission.requires_approval,
        sensitiveActions: mission.sensitive_actions,
        requiredIntegrations: mission.required_integrations,
        requiredPermissions: mission.required_permissions,
        plan: mission.plan_json,
        metadata: mission.metadata ?? {},
      });
      setFeedback('La planificación de la misión se guardó correctamente.');
      await loadMission();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo guardar la misión.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMissionState = async (action: 'pause' | 'resume' | 'cancel') => {
    if (!missionId) return;
    try {
      setIsSaving(true);
      setError(null);
      setFeedback(null);
      if (action === 'pause') {
        await commandCenterApi.pauseMission(missionId);
        setFeedback('La misión quedó pausada desde este detalle.');
      } else if (action === 'resume') {
        await commandCenterApi.resumeMission(missionId);
        setFeedback('La misión se reanudó según sus controles vigentes.');
      } else {
        await commandCenterApi.cancelMission(missionId);
        setFeedback('La misión quedó cancelada junto con su trabajo activo relacionado.');
      }
      await loadMission();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo cambiar el estado de la misión.');
    } finally {
      setIsSaving(false);
    }
  };

  if (error && isLoading) return <ErrorState message={error} action={<Button onClick={() => navigate('/missions')}>Volver</Button>} />;
  if (isLoading || !mission) return <LoadingState label="Cargando detalle de misión..." />;

  return (
    <PageShell title="Detalle de misión" description="Revisa, ajusta y deja lista la planificación antes de enviar la ejecución al motor operativo.">
      {error ? <ActionFeedback tone="warning" message={error} /> : null}
      {feedback ? <ActionFeedback tone="success" message={feedback} /> : null}

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard title="Planificación editable" subtitle="El operador puede ajustar el objetivo, el resumen y los pasos antes de iniciar la misión.">
          <div className="space-y-4">
            <FormField label="Título"><Input value={mission.title} onChange={(event) => updateMissionField('title', event.target.value)} /></FormField>
            <FormField label="Objetivo"><textarea className="panel-input min-h-[120px]" value={mission.objective} onChange={(event) => updateMissionField('objective', event.target.value)} /></FormField>
            <FormField label="Resumen"><textarea className="panel-input min-h-[120px]" value={mission.summary} onChange={(event) => updateMissionField('summary', event.target.value)} /></FormField>
            <FormField label="Descripción operativa"><textarea className="panel-input min-h-[140px]" value={mission.description} onChange={(event) => updateMissionField('description', event.target.value)} /></FormField>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Prioridad"><select className="panel-input" value={mission.priority} onChange={(event) => updateMissionField('priority', event.target.value)}><option value="low">baja</option><option value="medium">media</option><option value="high">alta</option><option value="critical">crítica</option></select></FormField>
              <FormField label="Estado"><select className="panel-input" value={mission.status} onChange={(event) => updateMissionField('status', event.target.value)}><option value="draft">borrador</option><option value="planned">planificada</option><option value="queued">en cola</option><option value="waiting_for_openclaw">esperando motor</option><option value="running">en ejecución</option><option value="waiting_for_approval">esperando aprobación</option><option value="paused">pausada</option><option value="blocked">bloqueada</option><option value="failed">fallida</option><option value="completed">completada</option><option value="cancelled">cancelada</option></select></FormField>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => void handleSave()} disabled={isSaving}>{isSaving ? 'Guardando...' : 'Guardar planificación'}</Button>
              {mission.status === 'running' ? <Button variant="secondary" onClick={() => void handleMissionState('pause')} disabled={isSaving}>Pausar misión</Button> : null}
              {mission.status === 'paused' || mission.status === 'waiting_for_approval' || mission.status === 'blocked' ? <Button variant="secondary" onClick={() => void handleMissionState('resume')} disabled={isSaving}>Reanudar misión</Button> : null}
              {mission.status !== 'completed' && mission.status !== 'cancelled' && mission.status !== 'failed' ? <Button variant="ghost" onClick={() => void handleMissionState('cancel')} disabled={isSaving}>Cancelar misión</Button> : null}
              <Button variant="secondary" onClick={() => navigate('/missions')}>Volver a misiones</Button>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Control de riesgo" subtitle="Esta lectura resume las exigencias de gobernanza y aprobación de la misión.">
          <DataTable
            columns={['Campo', 'Valor']}
            rows={[
              ['Estado', <StatusBadge status={mission.status} />],
              ['Riesgo', <StatusBadge status={mission.risk_level} />],
              ['Pasos estimados', <span className="text-sm text-zinc-300">{mission.estimated_steps}</span>],
              ['Aprobación requerida', <span className="text-sm text-zinc-300">{mission.requires_approval ? 'Sí' : 'No'}</span>],
              ['Acciones sensibles', <ChipGroup items={mission.sensitive_actions} emptyLabel="Sin acciones sensibles" />],
              ['Permisos requeridos', <ChipGroup items={mission.required_permissions} emptyLabel="Sin permisos especiales" />],
              ['Modo de ejecución', <div className="text-sm text-zinc-300">{(mission.metadata as any)?.sandbox ? 'Simulación segura' : 'Ejecución real'}</div>],
              ['Origen operativo', <div className="text-sm text-zinc-300">{(mission.metadata as any)?.workflowName ? `Flujo: ${(mission.metadata as any).workflowName}` : 'Misión directa'}</div>],
              ['Espacio operativo', <div className="text-sm text-zinc-300">{(mission.metadata as any)?.workspaceName ?? 'Sin espacio específico'}</div>],
              ['Decisión de política', <div className="text-sm text-zinc-300">{String((mission.metadata as any)?.decisionesPolitica?.bloqueaPorPolitica ? 'Bloqueada por política preventiva' : 'Sin bloqueo preventivo')}</div>],
            ]}
          />
        </SectionCard>
      </div>

      <SectionCard title="Pasos del plan" subtitle="Desglose inicial generado por Mission Control para la ejecución controlada.">
        <DataTable
          columns={['Paso', 'Descripción', 'Sensibilidad']}
          rows={mission.plan_json.map((step) => [
            <span className="text-sm font-semibold text-white">{step.title}</span>,
            <span className="text-sm text-zinc-300">{step.description}</span>,
            <span className="text-sm text-zinc-300">{step.sensitive ? 'Requiere vigilancia' : 'Operación normal'}</span>,
          ])}
        />
      </SectionCard>

      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard title="Tareas relacionadas" subtitle="Trabajo operativo generado desde esta misión.">
          <DataTable
            columns={['Título', 'Estado', 'Prioridad']}
            rows={(mission.related_tasks ?? []).map((task) => [
              <span className="text-sm font-semibold text-white">{task.title}</span>,
              <StatusBadge status={task.status} />,
              <span className="text-sm text-zinc-300">{task.priority}</span>,
            ])}
          />
        </SectionCard>

        <SectionCard title="Aprobaciones relacionadas" subtitle="Bloqueos o controles humanos asociados directamente a esta misión.">
          <DataTable
            columns={['Tipo', 'Estado', 'Solicitada por', 'Motivo']}
            rows={(mission.related_approvals ?? []).map((approval) => [
              <span className="text-sm font-semibold text-white">{approval.approval_type}</span>,
              <StatusBadge status={approval.status} />,
              <span className="text-sm text-zinc-300">{approval.requested_by}</span>,
              <span className="text-sm text-zinc-300">{approval.reason}</span>,
            ])}
          />
        </SectionCard>
      </div>

      <SectionCard title="Trazabilidad completa" subtitle="Sigue el hilo misión → tarea → ejecución → aprobación sin perder contexto operativo.">
        <DataTable
          columns={['Tipo', 'Identificador', 'Estado', 'Momento', 'Detalle']}
          rows={(mission.trace ?? []).map((entry) => [
            <span className="text-sm font-semibold text-white">{entry.type === 'task' ? 'Tarea' : entry.type === 'run' ? 'Ejecución' : 'Aprobación'}</span>,
            <span className="text-sm text-zinc-300">{entry.title}</span>,
            <StatusBadge status={entry.status} />,
            <span className="text-sm text-zinc-300">{new Date(entry.timestamp).toLocaleString('es-ES')}</span>,
            <span className="text-sm text-zinc-300">{entry.detail}</span>,
          ])}
        />
      </SectionCard>
    </PageShell>
  );
}
