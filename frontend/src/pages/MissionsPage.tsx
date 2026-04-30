import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { commandCenterApi } from '../api/commandCenterApi';
import { Button } from '../components/button';
import { Input } from '../components/input';
import { Modal } from '../components/modal';
import { ActionFeedback, ChipGroup, DataTable, ErrorState, FormField, LoadingState, PageShell, SectionCard, StatsGrid, StatusBadge } from '../components/ui';
import type { Mission } from '../types/domain';

export function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [priority, setPriority] = useState('medium');
  const [sandbox, setSandbox] = useState(true);

  // Carga la bandeja principal de misiones disponibles para operación.
  const loadMissions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setMissions(await commandCenterApi.getMissions());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudieron cargar las misiones.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadMissions();
  }, []);

  // Crea una misión de alto nivel y deja el plan listo para revisión humana.
  const handleCreateMission = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      setFeedback(null);
      await commandCenterApi.createMission({ prompt, createdBy: 'Guiller', priority, sandbox });
      setFeedback(`La misión se creó en modo ${sandbox ? 'simulación segura' : 'ejecución real'} y quedó lista para revisión.`);
      setPrompt('');
      setPriority('medium');
      setSandbox(true);
      setIsModalOpen(false);
      await loadMissions();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo crear la misión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Inicia la misión y crea la tarea base conectada con OpenClaw.
  const handleStartMission = async (missionId: string) => {
    try {
      setError(null);
      setFeedback(null);
      const result = await commandCenterApi.startMission(missionId);
      setFeedback(result.requiresApproval ? 'La misión inició y quedó en espera de aprobación.' : 'La misión inició correctamente.');
      await loadMissions();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo iniciar la misión.');
    }
  };

  const handleMissionState = async (missionId: string, action: 'pause' | 'resume' | 'cancel') => {
    try {
      setError(null);
      setFeedback(null);
      if (action === 'pause') {
        await commandCenterApi.pauseMission(missionId);
        setFeedback('La misión quedó pausada desde el centro de mando.');
      } else if (action === 'resume') {
        await commandCenterApi.resumeMission(missionId);
        setFeedback('La misión se reanudó según su estado de gobernanza.');
      } else {
        await commandCenterApi.cancelMission(missionId);
        setFeedback('La misión quedó cancelada y su trabajo relacionado se cerró.');
      }
      await loadMissions();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo cambiar el estado de la misión.');
    }
  };

  if (error && isLoading) return <ErrorState message={error} action={<Button onClick={() => void loadMissions()}>Reintentar</Button>} />;
  if (isLoading) return <LoadingState label="Cargando misiones..." />;

  return (
    <PageShell title="Misiones" description="Centro principal para convertir instrucciones de alto nivel en trabajo gobernado, auditable y ejecutable.">
      {error ? <ActionFeedback tone="warning" message={error} /> : null}
      {feedback ? <ActionFeedback tone="success" message={feedback} /> : null}

      <StatsGrid
        className="grid gap-5 md:grid-cols-2 xl:grid-cols-4"
        items={[
          { eyebrow: 'Total', title: `${missions.length} misiones`, description: 'Inventario actual de trabajo estratégico cargado en Mission Control.', tone: 'default' },
          { eyebrow: 'En curso', title: `${missions.filter((mission) => mission.status === 'running').length}`, description: 'Misiones actualmente en ejecución o seguimiento operativo.', tone: 'success' },
          { eyebrow: 'Aprobación', title: `${missions.filter((mission) => mission.status === 'waiting_for_approval').length}`, description: 'Misiones detenidas hasta recibir aprobación humana.', tone: 'warning' },
          { eyebrow: 'Críticas', title: `${missions.filter((mission) => mission.risk_level === 'critical').length}`, description: 'Trabajo de riesgo alto que exige mayor control y trazabilidad.', tone: 'danger' },
        ]}
      />

      <SectionCard title="Nueva misión" subtitle="Convierte una instrucción natural en un plan estructurado, con riesgo, pasos y control humano." action={<Button onClick={() => setIsModalOpen(true)}>Nueva misión</Button>}>
        <DataTable
          columns={['Título', 'Estado', 'Riesgo', 'Origen', 'Modo', 'Acciones sensibles', 'Acciones']}
          rows={missions.map((mission) => [
            <div className="max-w-md"><p className="text-sm font-semibold text-white">{mission.title}</p><p className="mt-1 text-xs text-zinc-500">{mission.summary}</p></div>,
            <StatusBadge status={mission.status} />,
            <StatusBadge status={mission.risk_level} />,
            <span className="text-sm text-zinc-300">{String((mission.metadata as Record<string, unknown> | undefined)?.workflowName ?? 'Directa')}</span>,
            <span className="text-sm text-zinc-300">{(mission.metadata as Record<string, unknown> | undefined)?.sandbox ? 'Simulación segura' : 'Ejecución real'}</span>,
            <ChipGroup items={mission.sensitive_actions} emptyLabel="Sin acciones sensibles" />,
            <div className="flex flex-wrap gap-2"><Link className="text-blue-300 hover:text-blue-200" to={`/missions/${mission.id}`}>Ver detalle</Link>{mission.status === 'planned' ? <Button size="sm" onClick={() => void handleStartMission(mission.id)}>Iniciar misión</Button> : null}{mission.status === 'running' ? <Button size="sm" variant="secondary" onClick={() => void handleMissionState(mission.id, 'pause')}>Pausar</Button> : null}{mission.status === 'paused' || mission.status === 'waiting_for_approval' || mission.status === 'blocked' ? <Button size="sm" variant="secondary" onClick={() => void handleMissionState(mission.id, 'resume')}>Reanudar</Button> : null}{mission.status !== 'completed' && mission.status !== 'cancelled' && mission.status !== 'failed' ? <Button size="sm" variant="ghost" onClick={() => void handleMissionState(mission.id, 'cancel')}>Cancelar</Button> : null}</div>,
          ])}
        />
      </SectionCard>

      <SectionCard title="Lectura de planificación" subtitle="Cada misión nace con un plan inicial editable, riesgo calculado y controles de aprobación.">
        <DataTable
          columns={['Indicador', 'Valor', 'Lectura']}
          rows={[
            ['Planificadas', missions.filter((mission) => mission.status === 'planned').length, 'Misiones listas para ser revisadas y puestas en marcha.'],
            ['Con aprobación requerida', missions.filter((mission) => mission.requires_approval).length, 'Trabajo que necesita intervención humana antes o durante la ejecución.'],
            ['Riesgo alto o crítico', missions.filter((mission) => ['high', 'critical'].includes(mission.risk_level)).length, 'Carga que debe pasar por políticas más estrictas.'],
          ]}
        />
      </SectionCard>

      <Modal open={isModalOpen} onOpenChange={setIsModalOpen} title="Nueva misión" description="Describe lo que quieres que Mission Control planifique y gobierne antes de enviarlo a OpenClaw.">
        <form className="space-y-4" onSubmit={handleCreateMission}>
          <FormField label="Instrucción de alto nivel" helper="Explica qué quieres lograr y el resultado esperado.">
            <textarea className="panel-input min-h-[140px]" placeholder="Ejemplo: revisa el correo, resume lo importante y prepara respuestas sugeridas." value={prompt} onChange={(event) => setPrompt(event.target.value)} />
          </FormField>
          <FormField label="Prioridad">
            <select className="panel-input" value={priority} onChange={(event) => setPriority(event.target.value)}>
              <option value="low">baja</option>
              <option value="medium">media</option>
              <option value="high">alta</option>
              <option value="critical">crítica</option>
            </select>
          </FormField>
          <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-zinc-200"><input type="checkbox" checked={sandbox} onChange={(event) => setSandbox(event.target.checked)} />Crear en modo simulación segura</label>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isSubmitting || prompt.trim().length < 12}>{isSubmitting ? 'Creando...' : 'Crear misión'}</Button>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
}
