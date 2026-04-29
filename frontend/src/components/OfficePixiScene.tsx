import { useEffect, useMemo, useRef } from 'react';
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { OfficeState } from '../types/domain';

type ZoneSummary = {
  zone: OfficeState['zones'][number];
  pulse: 'idle' | 'active' | 'blocked';
  activeRuns: number;
  approvals: number;
};

const minSceneWidth = 1380;
const minSceneHeight = 860;
const gridPadding = 28;

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

function zoneColors(pulse: ZoneSummary['pulse']) {
  if (pulse === 'blocked') return { fill: 0x3a2514, border: 0xf59e0b, accent: 0xfcd34d };
  if (pulse === 'active') return { fill: 0x14253b, border: 0x3b82f6, accent: 0x60a5fa };
  return { fill: 0x172030, border: 0x475569, accent: 0x94a3b8 };
}

function presenceColor(status: string) {
  if (status === 'focusing') return 0x22d3ee;
  if (status === 'in_review') return 0xa855f7;
  if (status === 'away') return 0xf59e0b;
  return 0x22c55e;
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
      const width = Math.max(host.clientWidth || 960, 320);
      const height = Math.max(host.clientHeight || 720, 420);
      await app.init({ width, height, antialias: true, backgroundAlpha: 0, preference: 'canvas', autoDensity: true, resolution: window.devicePixelRatio || 1 });
      if (cancelled) return;

      host.innerHTML = '';
      host.appendChild(app.canvas);
      appRef.current = app;

      const sceneWidth = Math.max(minSceneWidth, state.office.gridColumns * 178);
      const sceneHeight = Math.max(minSceneHeight, state.office.gridRows * 164);
      const scale = Math.min(width / sceneWidth, height / sceneHeight);
      const offsetX = (width - sceneWidth * scale) / 2;
      const offsetY = (height - sceneHeight * scale) / 2;

      const root = new Container();
      root.position.set(offsetX, offsetY);
      root.scale.set(scale);
      app.stage.addChild(root);

      const background = new Graphics();
      background.rect(0, 0, sceneWidth, sceneHeight).fill({ color: 0x09111c, alpha: 1 });
      background.rect(0, 0, sceneWidth, sceneHeight).fill({ color: 0x102438, alpha: 0.42 });
      root.addChild(background);

      const grid = new Graphics();
      const columnWidth = (sceneWidth - gridPadding * 2) / state.office.gridColumns;
      const rowHeight = (sceneHeight - gridPadding * 2) / state.office.gridRows;
      for (let column = 0; column <= state.office.gridColumns; column += 1) {
        const x = gridPadding + column * columnWidth;
        grid.moveTo(x, gridPadding).lineTo(x, sceneHeight - gridPadding).stroke({ color: 0xffffff, alpha: 0.06, width: 1 });
      }
      for (let row = 0; row <= state.office.gridRows; row += 1) {
        const y = gridPadding + row * rowHeight;
        grid.moveTo(gridPadding, y).lineTo(sceneWidth - gridPadding, y).stroke({ color: 0xffffff, alpha: 0.06, width: 1 });
      }
      root.addChild(grid);

      summaries.forEach((summary, zoneIndex) => {
        const { zone } = summary;
        const colors = zoneColors(summary.pulse);
        const x = gridPadding + zone.x * columnWidth;
        const y = gridPadding + zone.y * rowHeight;
        const widthZone = zone.w * columnWidth;
        const heightZone = zone.h * rowHeight;

        const room = new Graphics();
        room.roundRect(x, y, widthZone, heightZone, 24).fill({ color: colors.fill, alpha: 0.95 }).stroke({ color: colors.border, alpha: 0.56, width: 2 });
        room.roundRect(x + 10, y + 10, widthZone - 20, 44, 14).fill({ color: colors.accent, alpha: 0.12 });
        root.addChild(room);

        const title = new Text({ text: zone.name, style: new TextStyle({ fill: 0xf8fafc, fontFamily: 'Inter, sans-serif', fontSize: 18, fontWeight: '700' }) });
        title.position.set(x + 18, y + 16);
        root.addChild(title);

        const subtitle = new Text({ text: zone.subtitle, style: new TextStyle({ fill: 0xcbd5e1, fontFamily: 'Inter, sans-serif', fontSize: 11 }) });
        subtitle.position.set(x + 18, y + 38);
        root.addChild(subtitle);

        const stats = new Text({ text: `${zone.agents.length} agentes · ${zone.tasks.length} tareas · ${summary.activeRuns} runs`, style: new TextStyle({ fill: colors.accent, fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: '700' }) });
        stats.position.set(x + 18, y + heightZone - 18);
        stats.anchor.set(0, 1);
        root.addChild(stats);

        zone.stations.forEach((station, stationIndex) => {
          const sx = x + 20 + (stationIndex % 2) * Math.max((widthZone - 56) / 2, 92);
          const sy = y + 72 + Math.floor(stationIndex / 2) * 82;
          const stationBox = new Graphics();
          stationBox.roundRect(sx, sy, Math.min(110, widthZone - 32), 48, 12).fill({ color: 0x0a111a, alpha: 0.9 }).stroke({ color: 0xffffff, alpha: 0.15, width: 1.2 });
          root.addChild(stationBox);

          const stationLabel = new Text({ text: station.name.slice(0, 13), style: new TextStyle({ fill: 0xe2e8f0, fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: '700' }) });
          stationLabel.position.set(sx + 8, sy + 8);
          root.addChild(stationLabel);
        });

        zone.agents.slice(0, 6).forEach((assignment, agentIndex) => {
          const ax = x + 32 + (agentIndex % 3) * 48;
          const ay = y + heightZone - 56 - Math.floor(agentIndex / 3) * 42;
          const agent = new Graphics();
          agent.circle(ax, ay, 10).fill({ color: presenceColor(assignment.presenceStatus), alpha: assignment.presenceStatus === 'away' ? 0.55 : 0.95 });
          agent.circle(ax, ay + 16, 8).fill({ color: presenceColor(assignment.presenceStatus), alpha: 0.7 });
          root.addChild(agent);

          const name = new Text({ text: assignment.agent.name.split(' ')[0].slice(0, 8), style: new TextStyle({ fill: 0xffffff, fontFamily: 'Inter, sans-serif', fontSize: 8 }) });
          name.anchor.set(0.5, 0);
          name.position.set(ax, ay + 24);
          root.addChild(name);
        });

        if (zoneIndex < summaries.length - 1) {
          const next = summaries[zoneIndex + 1].zone;
          const route = new Graphics();
          route.moveTo(x + widthZone, y + heightZone / 2).lineTo(gridPadding + next.x * columnWidth, gridPadding + next.y * rowHeight + (next.h * rowHeight) / 2).stroke({ color: 0x60a5fa, alpha: 0.24, width: 3 });
          root.addChild(route);
        }
      });
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
