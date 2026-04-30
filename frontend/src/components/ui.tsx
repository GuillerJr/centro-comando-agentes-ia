import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  Bot,
  Building2,
  ChevronLeft,
  ChevronRight,
  Command,
  FolderKanban,
  LayoutDashboard,
  Menu,
  Search,
  Settings2,
  Shield,
  TerminalSquare,
  Sparkles,
  Waypoints,
  Workflow,
} from 'lucide-react';
import { commandCenterApi } from '../api/commandCenterApi';
import type { GlobalSearchResult } from '../types/domain';

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    title: 'Visión general',
    items: [
      { to: '/', label: 'Panel general', icon: LayoutDashboard },
      { to: '/office-design', label: 'Diseño de oficina', icon: Building2 },
      { to: '/missions', label: 'Misiones', icon: FolderKanban },
      { to: '/workflows', label: 'Flujos', icon: Workflow },
      { to: '/workspaces', label: 'Espacios', icon: Building2 },
      { to: '/agents', label: 'Agentes', icon: Bot },
      { to: '/skills', label: 'Capacidades', icon: Sparkles },
    ],
  },
  {
    title: 'Ejecución',
    items: [
      { to: '/tasks', label: 'Tareas', icon: FolderKanban },
      { to: '/runs', label: 'Ejecuciones', icon: Activity },
      { to: '/console', label: 'Consola', icon: Command },
      { to: '/approvals', label: 'Aprobaciones', icon: Shield },
      { to: '/audit', label: 'Auditoría', icon: Workflow },
    ],
  },
  {
    title: 'Plataforma',
    items: [
      { to: '/mcp', label: 'MCP', icon: Waypoints },
      { to: '/settings', label: 'Configuración', icon: Settings2 },
    ],
  },
];

const displayMap: Record<string, string> = {
  active: 'activo', inactive: 'inactivo', completed: 'completada', cancelled: 'cancelada', queued: 'en cola', awaiting_approval: 'en espera de aprobación', connected: 'conectado', disconnected: 'desconectado', approved: 'aprobada', rejected: 'rechazada', executed: 'ejecutada', pending: 'pendiente', running: 'en curso', failed: 'fallida', success: 'correcto', warning: 'advertencia', critical: 'crítica', low: 'baja', medium: 'media', high: 'alta', frontend: 'frontend', backend: 'backend', database: 'base de datos', mcp: 'mcp', fullstack: 'full stack', infrastructure: 'infraestructura', documentation: 'documentación', governance: 'gobernanza', architecture: 'arquitectura', operations: 'operaciones', ui: 'interfaz', specialist: 'especialista', executor: 'ejecutor', observer: 'observador', system: 'sistema', orchestrator: 'orquestador', workflow: 'flujo', workspace: 'espacio', owner: 'propietario', admin: 'administrador', operator: 'operador', viewer: 'visor', mock: 'simulado', production: 'producción', api: 'API', cli: 'CLI', stdio: 'stdio', websocket: 'websocket', http: 'http', maintenance: 'mantenimiento', deprecated: 'obsoleta', draft: 'borrador', logs: 'registros', info: 'información', error: 'error', available: 'disponible', occupied: 'ocupada', reserved: 'reservada', present: 'presente', focusing: 'en foco', in_review: 'en revisión', control: 'control', delivery: 'entrega', review: 'revisión', integration: 'integración', focus: 'enfoque', observability: 'observabilidad', desk: 'escritorio', table: 'mesa', booth: 'cabina', console: 'consola', gateway: 'pasarela', system_command: 'comando del sistema', sensitive_file_change: 'cambio de archivo sensible', delete_file: 'eliminación de archivo', config_change: 'cambio de configuración', database_change: 'cambio en base de datos', migration: 'migración', mcp_write: 'escritura MCP',
};

function humanizeToken(token: string) {
  const normalized = token.trim().toLowerCase();
  if (!normalized) return '';
  if (displayMap[normalized]) return displayMap[normalized];
  if (normalized === 'mcp' || normalized === 'ui') return normalized.toUpperCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function formatDisplayText(value: string) {
  const compact = value.trim();
  if (!compact) return value;
  const normalized = compact.toLowerCase();
  if (displayMap[normalized]) return humanizeToken(normalized);
  return compact.split(/([_\-\s/]+)/).map((part) => (/[_\-\s/]+/.test(part) ? part.replace(/_/g, ' ') : humanizeToken(part))).join('');
}

export function formatDateTime(value?: string | null) {
  if (!value) return 'No disponible';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
}

export function formatDuration(value?: number | null) {
  if (value === null || value === undefined) return 'Sin duración';
  if (value < 1000) return `${value} ms`;
  const seconds = value / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)} s`;
  const minutes = Math.floor(seconds / 60);
  const remainderSeconds = Math.round(seconds % 60);
  return `${minutes} min ${remainderSeconds}s`;
}

export function formatValue(value: unknown) {
  if (value === null || value === undefined || value === '') return 'Sin dato';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try { return JSON.stringify(value, null, 2); } catch { return 'Valor no serializable'; }
}

function statusTone(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes('active') || normalized.includes('completed') || normalized.includes('connected') || normalized.includes('approved') || normalized.includes('success')) return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300';
  if (normalized.includes('pending') || normalized.includes('running') || normalized.includes('warning') || normalized.includes('queued')) return 'border-amber-500/20 bg-amber-500/10 text-amber-300';
  if (normalized.includes('info')) return 'border-blue-500/20 bg-blue-500/10 text-blue-300';
  return 'border-rose-500/20 bg-rose-500/10 text-rose-300';
}

export function Sidebar({ isOpen, isCollapsed, onClose, onToggleCollapse }: { isOpen: boolean; isCollapsed: boolean; onClose: () => void; onToggleCollapse: () => void }) {
  return <><div className={`fixed inset-0 z-30 bg-black/55 backdrop-blur-sm transition lg:hidden ${isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`} onClick={onClose} /><aside className={`fixed inset-y-0 left-0 z-40 border-r border-white/8 bg-[#0b0d12] transition-all duration-300 lg:sticky lg:top-0 lg:z-auto lg:translate-x-0 ${isCollapsed ? 'w-[5.4rem]' : 'w-[15.5rem] xl:w-[16.5rem]'} ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}><div className="flex h-screen flex-col px-3 py-4"><div className="mb-5 flex items-center justify-between gap-3"><div className={`flex min-w-0 items-center ${isCollapsed ? 'w-full justify-center' : 'gap-3'}`}><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-black"><Command className="h-4 w-4" /></div>{!isCollapsed ? <div className="min-w-0"><p className="truncate text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Centro operativo</p><h1 className="mt-1 truncate text-sm font-semibold tracking-tight text-white">Centro de comando</h1></div> : null}</div><button type="button" onClick={onToggleCollapse} className="hidden h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-zinc-400 transition hover:border-white/15 hover:text-white lg:inline-flex">{isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}</button></div>{!isCollapsed ? <div className="mb-5 rounded-[18px] border border-white/8 bg-white/[0.03] px-3 py-3"><p className="truncate text-xs font-semibold text-white">Operación central</p><p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-zinc-500">Supervisión multiagente</p></div> : null}<div className="scrollbar-dark flex-1 overflow-y-auto pr-1"><div className="space-y-5">{navGroups.map((group) => <div key={group.title}>{!isCollapsed ? <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">{group.title}</p> : <div className="mx-auto mb-3 h-px w-7 bg-white/10" />}<nav className="grid gap-1">{group.items.map((item) => <NavLink key={item.to} to={item.to} className={({ isActive }) => `group rounded-2xl px-3 py-2.5 transition ${isActive ? 'bg-white text-black' : 'text-zinc-400 hover:bg-white/[0.04] hover:text-white'}`}>{({ isActive }) => { const Icon = item.icon; return <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}><div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${isActive ? 'bg-black text-white' : 'bg-white/[0.04] text-zinc-400'}`}><Icon className="h-4 w-4" /></div>{!isCollapsed ? <span className="truncate text-sm font-medium">{item.label}</span> : null}</div>; }}</NavLink>)}</nav></div>)}</div></div><div className="mt-5 rounded-[18px] border border-white/8 bg-white/[0.03] px-3 py-3">{isCollapsed ? <div className="mx-auto h-2.5 w-2.5 rounded-full bg-emerald-400" /> : <div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="text-xs font-semibold text-white">Entorno</p><p className="mt-1 text-[11px] text-zinc-500">Conectado</p></div><div className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400" /></div>}</div></div></aside></>;
}

function searchTypeLabel(type: string) {
  const labels: Record<string, string> = { agent: 'Agente', skill: 'Skill', task: 'Tarea', run: 'Run', approval: 'Aprobación', setting: 'Configuración', mcp: 'MCP' };
  return labels[type] ?? formatDisplayText(type);
}

export function Topbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
    setQuery('');
    setResults([]);
  }, [location.pathname]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        const data = await commandCenterApi.globalSearch(trimmed);
        setResults(data);
        setOpen(true);
      } catch {
        setResults([]);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => window.clearTimeout(timer);
  }, [query]);

  const hasPanel = useMemo(() => loading || query.trim().length >= 2, [loading, query]);

  return (
    <header className="sticky top-0 z-20 border-b border-white/8 bg-[#09090b]/88 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-4">
          <button type="button" onClick={onToggleSidebar} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-zinc-300 transition hover:border-white/15 hover:text-white lg:hidden"><Menu className="h-4 w-4" /></button>
          <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Operaciones orquestadas</p><h2 className="truncate text-[1.15rem] font-semibold tracking-tight text-white sm:text-[1.35rem]">Centro de comando</h2></div>
        </div>
        <div className="flex flex-col gap-3 xl:min-w-[520px] xl:flex-row xl:items-center xl:justify-end">
          <div className="relative flex-1">
            <div className="flex min-h-[42px] items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4">
              <Search className="h-4 w-4 shrink-0 text-zinc-500" />
              <input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} onFocus={() => query.trim().length >= 2 && setOpen(true)} className="w-full border-0 bg-transparent p-0 text-sm text-zinc-100 outline-none placeholder:text-zinc-500" placeholder="Buscar tareas, agentes, capacidades o registros" />
            </div>
            {open && hasPanel ? <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-2xl border border-white/8 bg-[#0f1117] shadow-2xl shadow-black/30"><div className="max-h-[24rem] overflow-y-auto">{loading ? <div className="px-4 py-4 text-sm text-zinc-400">Buscando...</div> : results.length === 0 ? <div className="px-4 py-4 text-sm text-zinc-500">Sin resultados para esta búsqueda.</div> : results.map((result) => <button key={`${result.type}-${result.id}`} type="button" onClick={() => navigate(result.href)} className="flex w-full flex-col gap-1 border-b border-white/6 px-4 py-3 text-left transition hover:bg-white/[0.04]"><div className="flex items-center justify-between gap-3"><span className="text-sm font-medium text-white">{result.title}</span><span className="rounded-full border border-white/8 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">{searchTypeLabel(result.type)}</span></div><span className="line-clamp-2 text-xs leading-5 text-zinc-400">{result.subtitle || 'Sin descripción'}</span></button>)}</div></div> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2"><MetricPill label="Entorno" value="Conectado" tone="success" /><MetricPill label="Modo" value="Producción" tone="default" /></div>
        </div>
      </div>
    </header>
  );
}

export function StatusBadge({ status }: { status: string }) { return <span className={`inline-flex max-w-full rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${statusTone(status)}`}>{formatDisplayText(status)}</span>; }
export function MetricCard({ label, value, helper, trend }: { label: string; value: string | number; helper: string; trend?: string }) { return <article className="panel-card panel-card-hover p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{value}</p></div>{trend ? <span className="w-fit rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-300">{trend}</span> : null}</div><p className="mt-2 text-sm leading-6 text-zinc-400">{helper}</p></article>; }
export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) { return <div className="panel-card p-6 text-center sm:p-8"><h3 className="text-lg font-semibold text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>{action ? <div className="mt-4 flex justify-center">{action}</div> : null}</div>; }
export function StatsGrid({ items, className = 'metric-grid' }: { items: Array<{ eyebrow: string; title: string; description: string; tone?: 'default' | 'success' | 'warning' | 'danger' }>; className?: string }) { return <div className={className}>{items.map((item) => <InfoPanel key={`${item.eyebrow}-${item.title}`} eyebrow={item.eyebrow} title={item.title} description={item.description} tone={item.tone} />)}</div>; }
export function LoadingState({ label }: { label: string }) { return <div className="panel-card p-5 sm:p-6"><div className="flex items-center gap-3 text-sm text-zinc-400"><span className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-blue-400" />{label}</div></div>; }
export function ErrorState({ message, action }: { message: string; action?: ReactNode }) { return <div className="rounded-[20px] border border-rose-500/20 bg-rose-500/10 p-4 text-rose-200 sm:p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-300">Error</p><p className="mt-2 text-sm leading-6">{message}</p>{action ? <div className="mt-4">{action}</div> : null}</div>; }
export function FormField({ label, helper, children }: { label: string; helper?: string; children: ReactNode }) { return <label className="grid gap-2"><span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</span>{children}{helper ? <span className="text-xs leading-5 text-zinc-500">{helper}</span> : null}</label>; }
export function ActionFeedback({ tone = 'default', message }: { tone?: 'default' | 'success' | 'warning'; message: string }) { const tones = { default: 'border-white/8 bg-white/[0.03] text-zinc-300', success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200', warning: 'border-amber-500/20 bg-amber-500/10 text-amber-200' }; return <div className={`rounded-[18px] border px-4 py-3 text-sm leading-6 ${tones[tone]}`}>{message}</div>; }
export function DetailList({ items }: { items: Array<{ label: string; value: ReactNode }> }) { return <div className="grid gap-3">{items.map((item) => <div key={item.label} className="surface-muted grid gap-1 px-4 py-3"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{item.label}</p><div className="min-w-0 break-words text-sm leading-6 text-zinc-200">{item.value}</div></div>)}</div>; }
export function ChipGroup({ items, emptyLabel = 'Sin elementos' }: { items: string[]; emptyLabel?: string }) { if (items.length === 0) return <span className="text-sm text-zinc-500">{emptyLabel}</span>; return <div className="flex flex-wrap gap-2">{items.map((item) => <span key={item} className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-xs font-medium text-zinc-300">{formatDisplayText(item)}</span>)}</div>; }
export function DataTable({ columns, rows }: { columns: string[]; rows: ReactNode[][] }) { if (rows.length === 0) return <EmptyState title="Sin registros disponibles" description="Todavía no hay datos para mostrar en este módulo operativo." />; return <div className="space-y-3"><div className="grid gap-3 md:hidden">{rows.map((row, rowIndex) => <article key={rowIndex} className="surface-muted p-4"><div className="grid gap-3">{row.map((cell, cellIndex) => <div key={cellIndex} className="grid gap-1"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{columns[cellIndex]}</p><div className="min-w-0 break-words text-sm leading-6 text-zinc-200">{cell}</div></div>)}</div></article>)}</div><div className="hidden overflow-hidden rounded-[18px] border border-white/8 bg-[#0f1117] md:block"><div className="scrollbar-dark overflow-x-auto overscroll-x-contain"><table className="w-full min-w-[640px] table-auto text-left text-sm md:min-w-[720px]"><thead className="bg-white/[0.03]"><tr>{columns.map((column) => <th key={column} className="px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 sm:px-4"><div className="min-w-0 whitespace-nowrap">{column}</div></th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex} className="border-t border-white/6">{row.map((cell, cellIndex) => <td key={cellIndex} className="px-3 py-3 align-top text-zinc-200 sm:px-4"><div className="min-w-0 max-w-[18rem] break-words text-sm leading-6 sm:max-w-[20rem] lg:max-w-none">{cell}</div></td>)}</tr>)}</tbody></table></div></div></div>; }
export function AgentCard({ title, description, status, meta }: { title: string; description: string; status: string; meta: string }) { return <article className="panel-card p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><h3 className="text-base font-semibold text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p></div><StatusBadge status={status} /></div><div className="mt-4 border-t border-white/8 pt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">{meta}</div></article>; }
export function SkillCard({ title, type, description }: { title: string; type: string; description: string }) { return <article className="panel-card p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><h3 className="text-base font-semibold text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p></div><StatusBadge status={type} /></div></article>; }
export function TaskStatusTimeline({ status, startedAt, completedAt }: { status: string; startedAt?: string | null; completedAt?: string | null }) { const items = [{ label: 'Estado', value: status, badge: true }, { label: 'Inicio', value: startedAt ?? 'Pendiente' }, { label: 'Fin', value: completedAt ?? 'Sin finalizar' }]; return <div className="panel-card p-4"><h3 className="text-base font-semibold text-white">Línea de tiempo</h3><div className="mt-4 space-y-3">{items.map((item) => <div key={item.label} className="flex flex-col gap-2 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm font-medium text-zinc-400">{item.label}</p><div className="text-left text-sm text-zinc-200 sm:text-right">{item.badge ? <StatusBadge status={item.value} /> : item.value}</div></div>)}</div></div>; }
export function RunLogViewer({ logs }: { logs: string }) { return <div className="panel-card p-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><h3 className="text-base font-semibold text-white">Registro de ejecución</h3><StatusBadge status="logs" /></div><pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-words rounded-[18px] border border-white/8 bg-black/20 p-4 text-xs leading-6 text-zinc-300">{logs}</pre></div>; }
export function ApprovalPanel({ children }: { children: ReactNode }) { return <div className="panel-card min-w-0 p-4">{children}</div>; }
export function CommandConsole({ children }: { children: ReactNode }) { return <div className="panel-card min-w-0 overflow-hidden p-4">{children}</div>; }
export function ConnectionStatus({ status, label }: { status: string; label: string }) { return <div className="inline-flex max-w-full items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3"><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${status === 'connected' ? 'bg-emerald-400' : 'bg-rose-400'}`} /><span className="truncate text-sm font-medium text-zinc-200">{label}</span></div>; }
export function ConfirmDialog({ title, description }: { title: string; description: string }) { return <div className="rounded-[18px] border border-amber-500/20 bg-amber-500/10 p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">Control</p><h3 className="mt-2 text-base font-semibold text-amber-100">{title}</h3><p className="mt-2 text-sm leading-6 text-amber-200/80">{description}</p></div>; }
export function ConsoleEmptyGuide() { return <div className="panel-card p-5 sm:p-6"><div className="flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03] text-zinc-200"><TerminalSquare className="h-5 w-5" /></div><div><h3 className="text-base font-semibold text-white">Consola de observación</h3><p className="mt-2 text-sm leading-6 text-zinc-400">Este módulo prioriza seguridad: muestra contexto operativo, pero no permite lanzar comandos arbitrarios desde la interfaz.</p></div></div></div>; }
export function PageShell({ title, description, children, action }: { title: string; description: string; children: ReactNode; action?: ReactNode }) { return <section className="min-w-0 space-y-5"><div className="panel-card hero-panel p-5 sm:p-6"><div className="relative flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Espacio de trabajo</p><h2 className="mt-2 break-words text-[1.7rem] font-semibold tracking-tight text-white sm:text-[2rem]">{title}</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">{description}</p></div>{action ? <div className="w-full min-w-0 xl:w-auto xl:max-w-xl">{action}</div> : null}</div></div>{children}</section>; }
export function SectionCard({ title, subtitle, children, action }: { title: string; subtitle?: string; children: ReactNode; action?: ReactNode }) { return <section className="panel-card p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div className="min-w-0"><h3 className="text-lg font-semibold text-white">{title}</h3>{subtitle ? <p className="mt-2 text-sm leading-6 text-zinc-400">{subtitle}</p> : null}</div>{action ? <div className="w-full sm:w-auto">{action}</div> : null}</div><div className="mt-5">{children}</div></section>; }
export function InfoPanel({ eyebrow, title, description, tone = 'default' }: { eyebrow: string; title: string; description: string; tone?: 'default' | 'success' | 'warning' | 'danger' | 'info' }) { const tones = { default: 'border-white/8 bg-white/[0.03]', success: 'border-emerald-500/20 bg-emerald-500/10', warning: 'border-amber-500/20 bg-amber-500/10', danger: 'border-rose-500/20 bg-rose-500/10', info: 'border-blue-500/20 bg-blue-500/10' }; return <article className={`rounded-[20px] border p-4 ${tones[tone]}`}><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{eyebrow}</p><h3 className="mt-2 text-sm font-semibold text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p></article>; }
export function MetricPill({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'success' | 'warning' | 'danger' | 'info' }) { const tones = { default: 'border-white/8 bg-white/[0.03] text-zinc-200', success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200', warning: 'border-amber-500/20 bg-amber-500/10 text-amber-200', danger: 'border-rose-500/20 bg-rose-500/10 text-rose-200', info: 'border-blue-500/20 bg-blue-500/10 text-blue-200' }; return <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${tones[tone]}`}><span className="font-semibold uppercase tracking-[0.16em] text-zinc-500">{label}</span><span className="font-medium">{value}</span></div>; }
