import { useEffect, useMemo, useRef } from 'react';
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { OfficeState } from '../types/domain';

type ZoneSummary = {
  zone: OfficeState['zones'][number];
  pulse: 'idle' | 'active' | 'blocked';
  activeRuns: number;
  approvals: number;
};

const minSceneWidth = 1680;
const minSceneHeight = 980;
const worldPadding = 44;

function buildSummaries(state: OfficeState): ZoneSummary[] {
  return state.zones.map((zone) => {
    const taskIds = new Set(zone.tasks.map((task) => task.id));
    const activeRuns = state.activeRuns.filter((run) => taskIds.has(run.task_id)).length;
    const approvals = state.pendingApprovals.filter((approval) => approval.task_id && taskIds.has(approval.task_id)).length;
    return {
      zone,
      activeRuns,
      approvals,
      pulse: approvals > 0 ? 'blocked' : activeRuns > 0 || zone.agents.length > 0 ? 'active' : 'idle',
    };
  });
}

function zonePalette(pulse: ZoneSummary['pulse'], zoneType: string) {
  const blocked = pulse === 'blocked';
  if (zoneType === 'control') return { floor: blocked ? 0x2a1f19 : 0x151d28, wall: blocked ? 0xf59e0b : 0x475569, accent: blocked ? 0xfb923c : 0x38bdf8, label: 0xe2e8f0 };
  if (zoneType === 'review') return { floor: blocked ? 0x2d211d : 0x171922, wall: blocked ? 0xf59e0b : 0x52525b, accent: blocked ? 0xfb923c : 0xa1a1aa, label: 0xe4e4e7 };
  if (zoneType === 'delivery') return { floor: blocked ? 0x2c241b : 0x162019, wall: blocked ? 0xf59e0b : 0x4b5563, accent: blocked ? 0xfb923c : 0x22c55e, label: 0xe5e7eb };
  if (zoneType === 'break') return { floor: blocked ? 0x31261d : 0x211b16, wall: blocked ? 0xf59e0b : 0x57534e, accent: blocked ? 0xfb923c : 0xf59e0b, label: 0xf5f5f4 };
  return { floor: blocked ? 0x2a1f19 : 0x181c22, wall: blocked ? 0xf59e0b : 0x475569, accent: blocked ? 0xfb923c : 0x64748b, label: 0xe2e8f0 };
}

function presenceColor(status: string) {
  if (status === 'focusing') return 0x38bdf8;
  if (status === 'in_review') return 0xa1a1aa;
  if (status === 'away') return 0xf59e0b;
  return 0x22c55e;
}

function drawBackground(root: Container, width: number, height: number) {
  const background = new Graphics();
  background.rect(0, 0, width, height).fill({ color: 0x091018, alpha: 1 });
  background.roundRect(16, 16, width - 32, height - 32, 36).fill({ color: 0x0f1720, alpha: 0.98 }).stroke({ color: 0x1f2937, alpha: 0.9, width: 2 });
  root.addChild(background);

  const grid = new Graphics();
  for (let x = 40; x < width; x += 84) {
    grid.moveTo(x, 24).lineTo(x, height - 24).stroke({ color: 0xffffff, alpha: 0.02, width: 1 });
  }
  for (let y = 40; y < height; y += 84) {
    grid.moveTo(24, y).lineTo(width - 24, y).stroke({ color: 0xffffff, alpha: 0.018, width: 1 });
  }
  root.addChild(grid);
}

function drawHud(root: Container, state: OfficeState) {
  const hud = new Graphics();
  hud.roundRect(72, 54, 420, 86, 22).fill({ color: 0x0b1220, alpha: 0.96 }).stroke({ color: 0x334155, alpha: 0.45, width: 2 });
  root.addChild(hud);

  const title = new Text({ text: 'Oficina operativa', style: new TextStyle({ fill: 0xf8fafc, fontFamily: 'Inter, sans-serif', fontSize: 25, fontWeight: '800' }) });
  title.position.set(96, 76);
  root.addChild(title);

  const subtitle = new Text({ text: `${state.office.name} · ${state.office.gridColumns} x ${state.office.gridRows} · ${state.pendingApprovals.length} aprobaciones pendientes`, style: new TextStyle({ fill: 0x94a3b8, fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: '600' }) });
  subtitle.position.set(96, 110);
  root.addChild(subtitle);
}

function drawMeetingRoom(root: Container, width: number, height: number) {
  const centerX = width / 2;
  const centerY = height / 2 + 12;
  const meeting = new Graphics();
  meeting.roundRect(centerX - 184, centerY - 118, 368, 236, 42).fill({ color: 0x121923, alpha: 1 }).stroke({ color: 0x475569, alpha: 0.5, width: 4 });
  meeting.roundRect(centerX - 136, centerY - 38, 272, 76, 34).fill({ color: 0x6b4423, alpha: 0.96 }).stroke({ color: 0x8b5e34, alpha: 0.45, width: 2 });

  const chairOffsets = [
    [-108, -68], [-36, -76], [36, -76], [108, -68],
    [-108, 68], [-36, 76], [36, 76], [108, 68],
  ];

  chairOffsets.forEach(([offsetX, offsetY]) => {
    meeting.roundRect(centerX + offsetX - 17, centerY + offsetY - 12, 34, 24, 9).fill({ color: 0x475569, alpha: 0.9 });
  });

  root.addChild(meeting);

  const label = new Text({ text: 'SALA CENTRAL', style: new TextStyle({ fill: 0xe2e8f0, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: '800', letterSpacing: 1 }) });
  label.anchor.set(0.5, 0.5);
  label.position.set(centerX, centerY - 82);
  root.addChild(label);
}

function drawCorridors(root: Container, width: number, height: number) {
  const corridor = new Graphics();
  const centerX = width / 2;
  const centerY = height / 2 + 12;
  corridor.roundRect(centerX - 46, 148, 92, height - 296, 24).fill({ color: 0x131a24, alpha: 0.95 });
  corridor.roundRect(180, centerY - 40, width - 360, 80, 24).fill({ color: 0x131a24, alpha: 0.95 });
  corridor.stroke({ color: 0x334155, alpha: 0.35, width: 2 });
  root.addChild(corridor);
}

function drawZone(root: Container, summary: ZoneSummary, index: number, total: number, state: OfficeState) {
  const zone = summary.zone;
  const zoneType = String((zone as { zoneType?: string }).zoneType ?? zone.zoneType ?? 'control');
  const palette = zonePalette(summary.pulse, zoneType);

  const sceneWidth = Math.max(minSceneWidth, state.office.gridColumns * 184);
  const sceneHeight = Math.max(minSceneHeight, state.office.gridRows * 176);
  const cellWidth = (sceneWidth - worldPadding * 2) / state.office.gridColumns;
  const cellHeight = (sceneHeight - worldPadding * 2) / state.office.gridRows;

  const centerX = sceneWidth / 2;
  const centerY = sceneHeight / 2 + 12;
  const outerRingX = centerX - 620;
  const outerRingRight = centerX + 210;
  const topRowY = 154;
  const bottomRowY = sceneHeight - 292;

  const width = Math.max(240, zone.w * cellWidth - 28);
  const height = Math.max(154, zone.h * cellHeight - 24);

  const positions = [
    { x: outerRingX, y: topRowY },
    { x: centerX - width / 2, y: topRowY },
    { x: outerRingRight, y: topRowY },
    { x: outerRingX, y: bottomRowY },
    { x: centerX - width / 2, y: bottomRowY },
    { x: outerRingRight, y: bottomRowY },
  ];

  const frame = positions[index % positions.length] ?? { x: outerRingX, y: topRowY };
  const x = frame.x;
  const y = frame.y;

  const roomShadow = new Graphics();
  roomShadow.roundRect(x + 8, y + 10, width, height, 28).fill({ color: 0x020617, alpha: 0.34 });
  root.addChild(roomShadow);

  const room = new Graphics();
  room.roundRect(x, y, width, height, 28).fill({ color: palette.floor, alpha: 1 }).stroke({ color: palette.wall, alpha: 0.75, width: 3 });
  room.roundRect(x + 14, y + 14, width - 28, height - 28, 20).stroke({ color: 0xffffff, alpha: 0.04, width: 1.5 });
  room.roundRect(x + 18, y + 18, width - 36, 34, 12).fill({ color: 0x0f172a, alpha: 0.42 });
  root.addChild(room);

  const door = new Graphics();
  const doorOnTop = index < 3;
  if (doorOnTop) {
    door.roundRect(x + width / 2 - 28, y + height - 6, 56, 12, 6).fill({ color: 0x64748b, alpha: 0.82 });
  } else {
    door.roundRect(x + width / 2 - 28, y - 6, 56, 12, 6).fill({ color: 0x64748b, alpha: 0.82 });
  }
  root.addChild(door);

  const title = new Text({ text: zone.name.toUpperCase(), style: new TextStyle({ fill: palette.label, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: '800', letterSpacing: 1 }) });
  title.position.set(x + 20, y + 22);
  root.addChild(title);

  const subtitle = new Text({ text: zone.subtitle, style: new TextStyle({ fill: 0x94a3b8, fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: '600' }) });
  subtitle.position.set(x + 20, y + 42);
  root.addChild(subtitle);

  const stats = new Text({ text: `${zone.agents.length} agentes · ${summary.activeRuns} ejecuciones · ${summary.approvals} aprobaciones`, style: new TextStyle({ fill: palette.accent, fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: '700' }) });
  stats.position.set(x + 20, y + height - 26);
  root.addChild(stats);

  const deskArea = new Graphics();
  deskArea.roundRect(x + 20, y + 68, width - 40, height - 112, 18).fill({ color: 0x0b1220, alpha: 0.16 });
  root.addChild(deskArea);

  const columns = Math.max(1, Math.floor((width - 44) / 116));
  zone.stations.forEach((station, stationIndex) => {
    const sx = x + 22 + (stationIndex % columns) * 116;
    const sy = y + 82 + Math.floor(stationIndex / columns) * 78;
    const stationAccent = palette.accent;
    const desk = new Graphics();
    desk.roundRect(sx, sy, 88, 44, 10).fill({ color: 0x6b4423, alpha: 0.96 });
    desk.roundRect(sx + 9, sy + 7, 70, 30, 8).fill({ color: 0x8b5e34, alpha: 0.2 });
    desk.roundRect(sx + 28, sy - 10, 32, 16, 6).fill({ color: 0x111827, alpha: 1 }).stroke({ color: stationAccent, alpha: 0.35, width: 1.5 });
    desk.circle(sx + 72, sy + 32, 4).fill({ color: stationAccent, alpha: 0.5 });
    root.addChild(desk);

    const stationText = new Text({ text: station.name.slice(0, 11), style: new TextStyle({ fill: 0xf8fafc, fontFamily: 'Inter, sans-serif', fontSize: 8.5, fontWeight: '700' }) });
    stationText.position.set(sx + 4, sy + 50);
    root.addChild(stationText);
  });

  zone.agents.slice(0, 8).forEach((assignment, agentIndex) => {
    const ax = x + 36 + (agentIndex % columns) * 52;
    const ay = y + height - 64 - Math.floor(agentIndex / columns) * 42;
    const color = presenceColor(assignment.presenceStatus);

    const body = new Graphics();
    body.circle(ax, ay, 8).fill({ color, alpha: 0.95 });
    body.roundRect(ax - 6, ay + 8, 12, 20, 6).fill({ color, alpha: 0.7 });
    root.addChild(body);
  });
}

export function OfficePixiScene({ state }: { state: OfficeState }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const summaries = useMemo(() => buildSummaries(state), [state]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    const app = new Application();

    const render = async () => {
      const width = Math.max(host.clientWidth || 1200, 700);
      const height = Math.max(host.clientHeight || 780, 560);
      await app.init({ width, height, antialias: true, backgroundAlpha: 0, preference: 'canvas', autoDensity: true, resolution: window.devicePixelRatio || 1 });
      if (cancelled) return;

      host.innerHTML = '';
      host.appendChild(app.canvas);
      appRef.current = app;

      const sceneWidth = Math.max(minSceneWidth, state.office.gridColumns * 184);
      const sceneHeight = Math.max(minSceneHeight, state.office.gridRows * 176);
      const scale = Math.min(width / sceneWidth, height / sceneHeight);
      const offsetX = (width - sceneWidth * scale) / 2;
      const offsetY = (height - sceneHeight * scale) / 2;

      const root = new Container();
      root.position.set(offsetX, offsetY);
      root.scale.set(scale);
      app.stage.addChild(root);

      drawBackground(root, sceneWidth, sceneHeight);
      drawHud(root, state);
      drawCorridors(root, sceneWidth, sceneHeight);
      drawMeetingRoom(root, sceneWidth, sceneHeight);
      summaries.forEach((summary, index) => drawZone(root, summary, index, summaries.length, state));
    };

    void render();

    return () => {
      cancelled = true;
      if (appRef.current) {
        appRef.current.destroy(true, { children: false, texture: false });
        appRef.current = null;
      }
      host.innerHTML = '';
    };
  }, [state, summaries]);

  return <div ref={hostRef} className="office-scene-canvas" />;
}
