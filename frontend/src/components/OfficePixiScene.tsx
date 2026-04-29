import { useEffect, useMemo, useRef, useState } from 'react';
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { OfficeState, OfficeZone, OfficeZoneTask } from '../types/domain';
import { formatDateTime, formatDisplayText } from './ui';

type Selection = { kind: 'zone'; zoneId: string } | { kind: 'agent'; assignmentId: string } | null;

type ZoneTone = {
  fill: number;
  border: number;
  accent: number;
  glow: number;
  label: string;
};

type SceneZoneSummary = {
  zone: OfficeState['zones'][number];
  activeRuns: OfficeState['activeRuns'];
  pendingApprovals: OfficeState['pendingApprovals'];
  focusingAgents: number;
  reviewingAgents: number;
  awayAgents: number;
  occupiedStations: number;
  pulseTone: 'idle' | 'active' | 'focus' | 'blocked';
  activityScore: number;
};

type SceneFlowLink = {
  id: string;
  fromZoneId: string;
  toZoneId: string;
  taskTitle: string;
  taskStatus: string;
};

type StationPoint = { x: number; y: number; width: number; height: number; zoneId: string };
type ZoneRect = { x: number; y: number; width: number; height: number; centerX: number; centerY: number };

const gridPadding = 28;
const minSceneWidth = 1200;
const minSceneHeight = 700;

const zoneTones: Record<SceneZoneSummary['pulseTone'], ZoneTone> = {
  idle: { fill: 0x18202f, border: 0x475569, accent: 0x94a3b8, glow: 0x64748b, label: 'En espera' },
  active: { fill: 0x14253b, border: 0x3b82f6, accent: 0x60a5fa, glow: 0x2563eb, label: 'Activa' },
  focus: { fill: 0x0f2d34, border: 0x22d3ee, accent: 0x67e8f9, glow: 0x0891b2, label: 'En foco' },
  blocked: { fill: 0x392515, border: 0xf59e0b, accent: 0xfcd34d, glow: 0xd97706, label: 'Bloqueada' },
};

const presenceTones: Record<string, { fill: number; ring: number; label: string }> = {
  present: { fill: 0x22c55e, ring: 0xbbf7d0, label: 'Presente' },
  focusing: { fill: 0x22d3ee, ring: 0xa5f3fc, label: 'En foco' },
  in_review: { fill: 0xa855f7, ring: 0xe9d5ff, label: 'En revisión' },
  away: { fill: 0xf59e0b, ring: 0xfde68a, label: 'Ausente' },
};

function getZoneTaskMap(zone: OfficeZone) {
  const taskMap = new Map<string, OfficeZoneTask>();
  (zone.tasks ?? []).forEach((task) => taskMap.set(task.id, task));
  (zone.agents ?? []).forEach((assignment) => {
    if (assignment.task) taskMap.set(assignment.task.id, assignment.task);
  });
  return taskMap;
}

function buildZoneSummaries(state: OfficeState): SceneZoneSummary[] {
  return state.zones.map((zone) => {
    const zoneTaskIds = new Set(getZoneTaskMap(zone).keys());
    const activeRuns = state.activeRuns.filter((run) => zoneTaskIds.has(run.task_id));
    const pendingApprovals = state.pendingApprovals.filter((approval) => approval.task_id && zoneTaskIds.has(approval.task_id));
    const focusingAgents = zone.agents.filter((assignment) => assignment.presenceStatus === 'focusing').length;
    const reviewingAgents = zone.agents.filter((assignment) => assignment.presenceStatus === 'in_review').length;
    const awayAgents = zone.agents.filter((assignment) => assignment.presenceStatus === 'away').length;
    const occupiedStations = zone.stations.filter((station) => (station.assignmentCount ?? 0) > 0).length;
    const activityScore = (zone.agents.length * 2) + (zone.tasks.length * 3) + (activeRuns.length * 4) + (focusingAgents * 2) + reviewingAgents + occupiedStations - awayAgents;
    const pulseTone: SceneZoneSummary['pulseTone'] = pendingApprovals.length > 0 ? 'blocked' : focusingAgents > 0 || activeRuns.length > 0 ? 'focus' : zone.agents.length > 0 || zone.tasks.length > 0 ? 'active' : 'idle';

    return {
      zone,
      activeRuns,
      pendingApprovals,
      focusingAgents,
      reviewingAgents,
      awayAgents,
      occupiedStations,
      pulseTone,
      activityScore,
    };
  });
}

function buildFlowLinks(state: OfficeState): SceneFlowLink[] {
  const taskZones = new Map<string, Array<{ zoneId: string; task: OfficeZoneTask; x: number; y: number }>>();

  state.zones.forEach((zone) => {
    getZoneTaskMap(zone).forEach((task, taskId) => {
      const entries = taskZones.get(taskId) ?? [];
      if (!entries.some((entry) => entry.zoneId === zone.id)) {
        entries.push({ zoneId: zone.id, task, x: zone.x, y: zone.y });
      }
      taskZones.set(taskId, entries);
    });
  });

  return Array.from(taskZones.entries())
    .flatMap(([taskId, zonesWithTask]) => {
      if (zonesWithTask.length < 2) return [];
      const orderedZones = [...zonesWithTask].sort((left, right) => (left.x + left.y) - (right.x + right.y));
      return orderedZones.slice(0, -1).map((fromZone, index) => {
        const toZone = orderedZones[index + 1];
        return {
          id: `${taskId}-${fromZone.zoneId}-${toZone.zoneId}`,
          fromZoneId: fromZone.zoneId,
          toZoneId: toZone.zoneId,
          taskTitle: fromZone.task.title,
          taskStatus: fromZone.task.status,
        };
      });
    })
    .slice(0, 10);
}

function initials(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'AG';
}

function stationGridPosition(index: number, total: number, zoneRect: ZoneRect) {
  const columns = Math.max(1, Math.min(3, Math.ceil(Math.sqrt(Math.max(total, 1)))));
  const rows = Math.max(1, Math.ceil(total / columns));
  const cellWidth = Math.max(68, (zoneRect.width - 36) / columns);
  const cellHeight = Math.max(56, (zoneRect.height - 118) / rows);
  const col = index % columns;
  const row = Math.floor(index / columns);

  return {
    x: zoneRect.x + 18 + (col * cellWidth),
    y: zoneRect.y + 76 + (row * cellHeight),
    width: Math.min(108, cellWidth - 12),
    height: Math.min(66, cellHeight - 10),
  };
}

function assignmentPosition(index: number, station: StationPoint) {
  const seatOffsets = [
    { x: 14, y: station.height + 14 },
    { x: station.width - 14, y: station.height + 14 },
    { x: 14, y: -10 },
    { x: station.width - 14, y: -10 },
  ];
  const seat = seatOffsets[index % seatOffsets.length];
  const orbit = Math.floor(index / seatOffsets.length) * 12;
  return {
    x: station.x + seat.x + orbit,
    y: station.y + seat.y,
  };
}

function drawRoundedPanel(graphics: Graphics, x: number, y: number, width: number, height: number, radius: number, fill: number, fillAlpha: number, border: number, borderAlpha: number, borderWidth = 1.2) {
  graphics.roundRect(x, y, width, height, radius).fill({ color: fill, alpha: fillAlpha }).stroke({ color: border, alpha: borderAlpha, width: borderWidth });
}

export function OfficePixiScene({ state }: { state: OfficeState }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const frameRef = useRef<number | null>(null);
  const [selection, setSelection] = useState<Selection>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [appReady, setAppReady] = useState(0);

  const zoneSummaries = useMemo(() => buildZoneSummaries(state), [state]);
  const flowLinks = useMemo(() => buildFlowLinks(state), [state]);

  const selectedZone = useMemo(() => {
    if (selection?.kind !== 'zone') return null;
    return zoneSummaries.find((entry) => entry.zone.id === selection.zoneId) ?? null;
  }, [selection, zoneSummaries]);

  const selectedAssignment = useMemo(() => {
    if (selection?.kind !== 'agent') return null;
    for (const zone of state.zones) {
      const assignment = zone.agents.find((entry) => entry.assignmentId === selection.assignmentId);
      if (assignment) return { zone, assignment };
    }
    return null;
  }, [selection, state.zones]);

  const topZones = useMemo(() => [...zoneSummaries].sort((left, right) => right.activityScore - left.activityScore).slice(0, 3), [zoneSummaries]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const nextWidth = Math.round(entry.contentRect.width);
      const nextHeight = Math.round(entry.contentRect.height);
      setViewport((current) => current.width === nextWidth && current.height === nextHeight ? current : { width: nextWidth, height: nextHeight });
    });

    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || viewport.width < 24 || viewport.height < 24 || appRef.current) return undefined;

    let cancelled = false;
    const app = new Application();

    void app.init({
      width: viewport.width,
      height: viewport.height,
      antialias: true,
      backgroundAlpha: 0,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1,
    }).then(() => {
      if (cancelled) {
        app.destroy(true, { children: true, texture: true });
        return;
      }

      host.appendChild(app.canvas);
      appRef.current = app;
      setAppReady((current) => current + 1);
    });

    return () => {
      cancelled = true;
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      if (appRef.current === app) {
        appRef.current.destroy(true, { children: true, texture: true });
        appRef.current = null;
        setAppReady((current) => current + 1);
      }
      if (host.contains(app.canvas)) {
        host.removeChild(app.canvas);
      }
    };
  }, [viewport.height, viewport.width]);

  useEffect(() => {
    const app = appRef.current;
    if (!app || viewport.width < 24 || viewport.height < 24) return undefined;

    app.renderer.resize(viewport.width, viewport.height);
    app.stage.removeChildren();

    const sceneWidth = Math.max(minSceneWidth, state.office.gridColumns * 178);
    const sceneHeight = Math.max(minSceneHeight, state.office.gridRows * 164);
    const scaleX = viewport.width / sceneWidth;
    const scaleY = viewport.height / sceneHeight;
    const scale = Math.min(scaleX, scaleY);
    const offsetX = (viewport.width - (sceneWidth * scale)) / 2;
    const offsetY = (viewport.height - (sceneHeight * scale)) / 2;

    const root = new Container();
    root.position.set(offsetX, offsetY);
    root.scale.set(scale);
    app.stage.addChild(root);

    const background = new Graphics();
    background.rect(0, 0, sceneWidth, sceneHeight).fill({ color: 0x09111c, alpha: 1 });
    background.rect(0, 0, sceneWidth, sceneHeight).fill({ color: 0x102438, alpha: 0.42 });
    root.addChild(background);

    const ambience = new Graphics();
    ambience.circle(sceneWidth * 0.16, sceneHeight * 0.22, 120).fill({ color: 0x2563eb, alpha: 0.11 });
    ambience.circle(sceneWidth * 0.82, sceneHeight * 0.66, 144).fill({ color: 0xa855f7, alpha: 0.08 });
    ambience.circle(sceneWidth * 0.62, sceneHeight * 0.14, 92).fill({ color: 0x22d3ee, alpha: 0.08 });
    root.addChild(ambience);

    const grid = new Graphics();
    const columnWidth = (sceneWidth - (gridPadding * 2)) / state.office.gridColumns;
    const rowHeight = (sceneHeight - (gridPadding * 2)) / state.office.gridRows;

    for (let column = 0; column <= state.office.gridColumns; column += 1) {
      const x = gridPadding + (column * columnWidth);
      grid.moveTo(x, gridPadding).lineTo(x, sceneHeight - gridPadding).stroke({ color: 0xffffff, alpha: 0.06, width: 1 });
    }
    for (let row = 0; row <= state.office.gridRows; row += 1) {
      const y = gridPadding + (row * rowHeight);
      grid.moveTo(gridPadding, y).lineTo(sceneWidth - gridPadding, y).stroke({ color: 0xffffff, alpha: 0.06, width: 1 });
    }
    root.addChild(grid);

    const roomLayer = new Container();
    const flowBaseLayer = new Graphics();
    const dynamicLayer = new Graphics();
    const stationPoints = new Map<string, StationPoint>();
    const beaconPoints: Array<{ x: number; y: number; tone: SceneZoneSummary['pulseTone']; selected: boolean }> = [];
    const animatedFlows: Array<{ fromX: number; fromY: number; toX: number; toY: number; tone: number; selected: boolean }> = [];
    const selectedAccent = 0xf8fafc;

    flowLinks.forEach((link) => {
      const fromZone = state.zones.find((zone) => zone.id === link.fromZoneId);
      const toZone = state.zones.find((zone) => zone.id === link.toZoneId);
      if (!fromZone || !toZone) return;

      const fromCenterX = gridPadding + ((fromZone.x + (fromZone.w / 2)) * columnWidth);
      const fromCenterY = gridPadding + ((fromZone.y + (fromZone.h / 2)) * rowHeight);
      const toCenterX = gridPadding + ((toZone.x + (toZone.w / 2)) * columnWidth);
      const toCenterY = gridPadding + ((toZone.y + (toZone.h / 2)) * rowHeight);
      const selected = selection?.kind === 'zone' && (selection.zoneId === fromZone.id || selection.zoneId === toZone.id);
      flowBaseLayer.moveTo(fromCenterX, fromCenterY).lineTo(toCenterX, toCenterY).stroke({ color: 0x38bdf8, alpha: selected ? 0.34 : 0.18, width: selected ? 5 : 3 });
      animatedFlows.push({ fromX: fromCenterX, fromY: fromCenterY, toX: toCenterX, toY: toCenterY, tone: 0x67e8f9, selected });
    });
    root.addChild(flowBaseLayer);

    zoneSummaries.forEach((summary) => {
      const { zone } = summary;
      const tone = zoneTones[summary.pulseTone];
      const x = gridPadding + (zone.x * columnWidth);
      const y = gridPadding + (zone.y * rowHeight);
      const width = zone.w * columnWidth;
      const height = zone.h * rowHeight;
      const selected = selection?.kind === 'zone' && selection.zoneId === zone.id;
      const zoneRect = { x, y, width, height, centerX: x + (width / 2), centerY: y + (height / 2) };
      beaconPoints.push({ x: x + width - 26, y: y + 26, tone: summary.pulseTone, selected });

      const zoneContainer = new Container();
      zoneContainer.eventMode = 'static';
      zoneContainer.cursor = 'pointer';
      zoneContainer.on('pointertap', () => setSelection({ kind: 'zone', zoneId: zone.id }));

      const room = new Graphics();
      drawRoundedPanel(room, x, y, width, height, 24, tone.fill, 0.92, selected ? selectedAccent : tone.border, selected ? 0.95 : 0.48, selected ? 2.6 : 1.4);
      room.roundRect(x + 10, y + 10, width - 20, 42, 14).fill({ color: tone.accent, alpha: 0.12 });
      if (summary.pendingApprovals.length > 0) {
        room.roundRect(x + width - 92, y + 16, 64, 16, 8).fill({ color: 0xf59e0b, alpha: 0.2 });
      }
      zoneContainer.addChild(room);

      const title = new Text({ text: zone.name, style: new TextStyle({ fill: 0xf8fafc, fontFamily: 'Inter, sans-serif', fontSize: 18, fontWeight: '700' }) });
      title.position.set(x + 18, y + 16);
      zoneContainer.addChild(title);

      const subtitle = new Text({ text: zone.subtitle || `Sala ${formatDisplayText(zone.zoneType)}`, style: new TextStyle({ fill: 0xcbd5e1, fontFamily: 'Inter, sans-serif', fontSize: 11 }) });
      subtitle.position.set(x + 18, y + 38);
      zoneContainer.addChild(subtitle);

      const stateLabel = new Text({ text: `${tone.label} · ${zone.agents.length} agentes`, style: new TextStyle({ fill: tone.accent, fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: '700' }) });
      stateLabel.position.set(x + 18, y + height - 18);
      stateLabel.anchor.set(0, 1);
      zoneContainer.addChild(stateLabel);

      const loadLabel = new Text({ text: `${summary.activeRuns.length} runs · ${zone.tasks.length} tareas · ${summary.pendingApprovals.length} bloqueos`, style: new TextStyle({ fill: 0x94a3b8, fontFamily: 'Inter, sans-serif', fontSize: 10 }) });
      loadLabel.position.set(x + width - 18, y + height - 18);
      loadLabel.anchor.set(1, 1);
      zoneContainer.addChild(loadLabel);

      zone.stations.forEach((station, stationIndex) => {
        const stationRect = stationGridPosition(stationIndex, zone.stations.length, zoneRect);
        stationPoints.set(station.id, { ...stationRect, zoneId: zone.id });

        const stationPanel = new Graphics();
        const stationSelected = selection?.kind === 'agent' && zone.agents.some((assignment) => assignment.assignmentId === selection.assignmentId && assignment.stationId === station.id);
        drawRoundedPanel(stationPanel, stationRect.x, stationRect.y, stationRect.width, stationRect.height, 14, station.status === 'maintenance' ? 0x3b2613 : 0x08111d, 0.86, stationSelected ? selectedAccent : station.status === 'occupied' ? 0x38bdf8 : 0x334155, stationSelected ? 0.82 : 0.54);
        stationPanel.roundRect(stationRect.x + 8, stationRect.y + 8, stationRect.width - 16, 12, 6).fill({ color: station.status === 'maintenance' ? 0xf59e0b : 0x94a3b8, alpha: 0.18 });
        zoneContainer.addChild(stationPanel);

        const stationLabel = new Text({ text: station.name, style: new TextStyle({ fill: 0xe2e8f0, fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: '700' }) });
        stationLabel.position.set(stationRect.x + 8, stationRect.y + 24);
        zoneContainer.addChild(stationLabel);

        const stationMeta = new Text({ text: `${formatDisplayText(station.stationType)} · cap ${station.capacity}`, style: new TextStyle({ fill: 0x94a3b8, fontFamily: 'Inter, sans-serif', fontSize: 9 }) });
        stationMeta.position.set(stationRect.x + 8, stationRect.y + 40);
        zoneContainer.addChild(stationMeta);
      });

      zone.agents.forEach((assignment, assignmentIndex) => {
        const station = stationPoints.get(assignment.stationId);
        const point = station ? assignmentPosition(assignmentIndex, station) : { x: x + 28 + ((assignmentIndex % 4) * 34), y: y + height - 44 - (Math.floor(assignmentIndex / 4) * 26) };
        const presenceTone = presenceTones[assignment.presenceStatus] ?? presenceTones.present;
        const selectedAgent = selection?.kind === 'agent' && selection.assignmentId === assignment.assignmentId;
        const agent = new Container();
        agent.eventMode = 'static';
        agent.cursor = 'pointer';
        agent.on('pointertap', () => setSelection({ kind: 'agent', assignmentId: assignment.assignmentId }));

        const body = new Graphics();
        body.circle(point.x, point.y, 10).fill({ color: presenceTone.fill, alpha: assignment.presenceStatus === 'away' ? 0.54 : 0.94 });
        body.circle(point.x, point.y + 16, 8).fill({ color: presenceTone.fill, alpha: assignment.presenceStatus === 'away' ? 0.44 : 0.72 });
        body.circle(point.x, point.y, selectedAgent ? 14 : 12.5).stroke({ color: selectedAgent ? selectedAccent : presenceTone.ring, width: selectedAgent ? 2.2 : 1.4, alpha: 0.9 });
        agent.addChild(body);

        const tag = new Text({ text: initials(assignment.agent.name), style: new TextStyle({ fill: 0xf8fafc, fontFamily: 'Inter, sans-serif', fontSize: 7, fontWeight: '800' }) });
        tag.anchor.set(0.5);
        tag.position.set(point.x, point.y + 0.5);
        agent.addChild(tag);

        root.addChild(agent);
      });

      roomLayer.addChild(zoneContainer);
    });

    root.addChild(roomLayer);
    root.addChild(dynamicLayer);

    let disposed = false;
    const start = performance.now();
    const renderDynamic = () => {
      if (disposed) return;
      const elapsed = (performance.now() - start) / 1000;
      dynamicLayer.clear();

      beaconPoints.forEach((beacon) => {
        const tone = zoneTones[beacon.tone];
        const radius = 8 + (Math.sin(elapsed * (beacon.tone === 'blocked' ? 4 : 2.5)) + 1.1) * 3.6;
        dynamicLayer.circle(beacon.x, beacon.y, radius).stroke({ color: tone.glow, width: beacon.selected ? 3 : 2, alpha: beacon.selected ? 0.7 : 0.42 });
        dynamicLayer.circle(beacon.x, beacon.y, 5).fill({ color: tone.accent, alpha: 0.92 });
      });

      animatedFlows.forEach((flow, index) => {
        const progress = ((elapsed * 0.22) + (index * 0.17)) % 1;
        const x = flow.fromX + ((flow.toX - flow.fromX) * progress);
        const y = flow.fromY + ((flow.toY - flow.fromY) * progress);
        dynamicLayer.circle(x, y, flow.selected ? 6 : 4.5).fill({ color: flow.tone, alpha: flow.selected ? 0.95 : 0.78 });
      });

      frameRef.current = requestAnimationFrame(renderDynamic);
    };

    renderDynamic();

    return () => {
      disposed = true;
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [appReady, flowLinks, selection, state, viewport.height, viewport.width, zoneSummaries]);

  return (
    <div className="office-scene-shell">
      <div className="office-scene-stage">
        <div className="office-scene-toolbar">
          <div>
            <p className="office-scene-toolbar__eyebrow">Escena operativa</p>
            <h4 className="office-scene-toolbar__title">Oficina viva en 2D</h4>
          </div>
          <div className="office-scene-toolbar__metrics">
            <span>{state.metrics.zones} salas</span>
            <span>{state.metrics.stations} estaciones</span>
            <span>{state.metrics.activeAgents} agentes visibles</span>
          </div>
        </div>
        <div ref={hostRef} className="office-scene-canvas" />
      </div>

      <div className="office-scene-sidebar">
        <section className="office-scene-panel">
          <p className="office-scene-panel__eyebrow">Selección</p>
          {selectedZone ? (
            <div className="office-scene-selection">
              <h4>{selectedZone.zone.name}</h4>
              <p>{selectedZone.zone.subtitle}</p>
              <div className="office-scene-chip-row">
                <span>{zoneTones[selectedZone.pulseTone].label}</span>
                <span>{selectedZone.zone.stations.length} estaciones</span>
                <span>{selectedZone.zone.agents.length} agentes</span>
              </div>
              <dl className="office-scene-definition-list">
                <div><dt>Runs</dt><dd>{selectedZone.activeRuns.length}</dd></div>
                <div><dt>Tareas</dt><dd>{selectedZone.zone.tasks.length}</dd></div>
                <div><dt>Aprobaciones</dt><dd>{selectedZone.pendingApprovals.length}</dd></div>
                <div><dt>Pulso</dt><dd>{selectedZone.activityScore}</dd></div>
              </dl>
            </div>
          ) : null}

          {selectedAssignment ? (
            <div className="office-scene-selection">
              <h4>{selectedAssignment.assignment.agent.name}</h4>
              <p>{selectedAssignment.zone.name} · {selectedAssignment.assignment.stationName}</p>
              <div className="office-scene-chip-row">
                <span>{presenceTones[selectedAssignment.assignment.presenceStatus]?.label ?? 'Presente'}</span>
                <span>{formatDisplayText(selectedAssignment.assignment.assignmentRole)}</span>
              </div>
              <dl className="office-scene-definition-list">
                <div><dt>Tarea</dt><dd>{selectedAssignment.assignment.task?.title ?? 'Sin tarea activa'}</dd></div>
                <div><dt>Presencia</dt><dd>{presenceTones[selectedAssignment.assignment.presenceStatus]?.label ?? 'Presente'}</dd></div>
                <div><dt>Notas</dt><dd>{selectedAssignment.assignment.notes ?? 'Sin notas'}</dd></div>
                <div><dt>Creado</dt><dd>{formatDateTime(selectedAssignment.assignment.agent.created_at)}</dd></div>
              </dl>
            </div>
          ) : null}

          {!selectedZone && !selectedAssignment ? (
            <div className="office-scene-selection office-scene-selection--empty">
              <h4>Explora la oficina</h4>
              <p>Haz click sobre una sala o un agente para inspeccionar el estado operativo real detrás de la escena.</p>
            </div>
          ) : null}
        </section>

        <section className="office-scene-panel">
          <p className="office-scene-panel__eyebrow">Leyenda</p>
          <div className="office-scene-legend">
            <div><span className="office-scene-legend__dot office-scene-legend__dot--focus" />Sala en foco o ejecutando runs</div>
            <div><span className="office-scene-legend__dot office-scene-legend__dot--blocked" />Bloqueo por aprobación pendiente</div>
            <div><span className="office-scene-legend__dot office-scene-legend__dot--agent" />Agente visible asignado a estación</div>
            <div><span className="office-scene-legend__line" />Handoff entre zonas por tarea compartida</div>
          </div>
        </section>

        <section className="office-scene-panel">
          <p className="office-scene-panel__eyebrow">Zonas con más actividad</p>
          <div className="office-scene-ranking">
            {topZones.map((entry) => (
              <button key={entry.zone.id} type="button" className="office-scene-ranking__item" onClick={() => setSelection({ kind: 'zone', zoneId: entry.zone.id })}>
                <div>
                  <strong>{entry.zone.name}</strong>
                  <span>{zoneTones[entry.pulseTone].label} · {entry.zone.tasks.length} tareas</span>
                </div>
                <span>{entry.activityScore}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
