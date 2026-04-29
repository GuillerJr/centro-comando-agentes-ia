import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Activity,
  Bot,
  ChevronLeft,
  ChevronRight,
  Command,
  FolderKanban,
  LayoutDashboard,
  Menu,
  Search,
  Settings2,
  Shield,
  Sparkles,
  Waypoints,
  Workflow,
} from 'lucide-react';

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
  active: 'activo',
  inactive: 'inactivo',
  completed: 'completada',
  connected: 'conectado',
  approved: 'aprobada',
  rejected: 'rechazada',
  pending: 'pendiente',
  running: 'en curso',
  failed: 'fallida',
  success: 'correcto',
  warning: 'advertencia',
  critical: 'crítica',
  low: 'baja',
  medium: 'media',
  high: 'alta',
  frontend: 'frontend',
  backend: 'backend',
  database: 'base de datos',
  mcp: 'mcp',
  fullstack: 'full stack',
  infrastructure: 'infraestructura',
  documentation: 'documentación',
  governance: 'gobernanza',
  architecture: 'arquitectura',
  operations: 'operaciones',
  ui: 'interfaz',
  specialist: 'especialista',
  executor: 'ejecutor',
  observer: 'observador',
  system: 'sistema',
  orchestrator: 'orquestador',
  mock: 'simulado',
  production: 'producción',
  logs: 'registros',
  info: 'información',
  error: 'error',
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

  return compact
    .split(/([_\-\s/]+)/)
    .map((part) => (/[_\-\s/]+/.test(part) ? part.replace(/_/g, ' ') : humanizeToken(part)))
    .join('');
}

function statusTone(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes('active') || normalized.includes('completed') || normalized.includes('connected') || normalized.includes('approved') || normalized.includes('success')) {
    return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300';
  }
  if (normalized.includes('pending') || normalized.includes('running') || normalized.includes('warning') || normalized.includes('queued')) {
    return 'border-amber-500/20 bg-amber-500/10 text-amber-300';
  }
  if (normalized.includes('info')) {
    return 'border-blue-500/20 bg-blue-500/10 text-blue-300';
  }
  return 'border-rose-500/20 bg-rose-500/10 text-rose-300';
}

export function Sidebar({ isOpen, isCollapsed, onClose, onToggleCollapse }: { isOpen: boolean; isCollapsed: boolean; onClose: () => void; onToggleCollapse: () => void }) {
  return (
    <>
      <div className={`fixed inset-0 z-30 bg-black/55 backdrop-blur-sm transition lg:hidden ${isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`} onClick={onClose} />
      <aside className={`fixed inset-y-0 left-0 z-40 border-r border-white/8 bg-[#0b0d12] transition-all duration-300 lg:sticky lg:top-0 lg:z-auto lg:translate-x-0 ${isCollapsed ? 'w-[5.4rem]' : 'w-[15.5rem] xl:w-[16.5rem]'} ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex h-screen flex-col px-3 py-4">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className={`flex min-w-0 items-center ${isCollapsed ? 'w-full justify-center' : 'gap-3'}`}>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-black">
                  <Command className="h-4 w-4" />
                </div>
                {!isCollapsed ? (
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Centro operativo</p>
                    <h1 className="mt-1 truncate text-sm font-semibold tracking-tight text-white">Centro de comando</h1>
                  </div>
                ) : null}
            </div>

            <button type="button" onClick={onToggleCollapse} className="hidden h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-zinc-400 transition hover:border-white/15 hover:text-white lg:inline-flex">
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          {!isCollapsed ? (
            <div className="mb-5 rounded-[18px] border border-white/8 bg-white/[0.03] px-3 py-3">
              <p className="truncate text-xs font-semibold text-white">Operación central</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-zinc-500">Supervisión multiagente</p>
            </div>
          ) : null}

          <div className="scrollbar-dark flex-1 overflow-y-auto pr-1">
            <div className="space-y-5">
              {navGroups.map((group) => (
                <div key={group.title}>
                  {!isCollapsed ? <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">{group.title}</p> : <div className="mx-auto mb-3 h-px w-7 bg-white/10" />}
                  <nav className="grid gap-1">
                    {group.items.map((item) => (
                      <NavLink key={item.to} to={item.to} className={({ isActive }) => `group rounded-2xl px-3 py-2.5 transition ${isActive ? 'bg-white text-black' : 'text-zinc-400 hover:bg-white/[0.04] hover:text-white'}`}>
                        {({ isActive }) => {
                          const Icon = item.icon;
                          return (
                            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${isActive ? 'bg-black text-white' : 'bg-white/[0.04] text-zinc-400'}`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              {!isCollapsed ? <span className="truncate text-sm font-medium">{item.label}</span> : null}
                            </div>
                          );
                        }}
                      </NavLink>
                    ))}
                  </nav>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-[18px] border border-white/8 bg-white/[0.03] px-3 py-3">
            {isCollapsed ? <div className="mx-auto h-2.5 w-2.5 rounded-full bg-emerald-400" /> : <div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="text-xs font-semibold text-white">Runtime</p><p className="mt-1 text-[11px] text-zinc-500">Conectado</p></div><div className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400" /></div>}
          </div>
        </div>
      </aside>
    </>
  );
}

export function Topbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/8 bg-[#09090b]/88 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-4">
          <button type="button" onClick={onToggleSidebar} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-zinc-300 transition hover:border-white/15 hover:text-white lg:hidden"><Menu className="h-4 w-4" /></button>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Operaciones orquestadas</p>
            <h2 className="truncate text-[1.15rem] font-semibold tracking-tight text-white sm:text-[1.35rem]">Centro de comando</h2>
          </div>
        </div>

        <div className="flex flex-col gap-3 xl:min-w-[520px] xl:flex-row xl:items-center xl:justify-end">
          <div className="flex min-h-[42px] flex-1 items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4">
            <Search className="h-4 w-4 shrink-0 text-zinc-500" />
            <input className="w-full border-0 bg-transparent p-0 text-sm text-zinc-100 outline-none placeholder:text-zinc-500" placeholder="Buscar tareas, agentes, capacidades o registros" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <MetricPill label="Runtime" value="Conectado" tone="success" />
            <MetricPill label="Entorno" value="Producción" tone="default" />
          </div>
        </div>
      </div>
    </header>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={`inline-flex max-w-full rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${statusTone(status)}`}>{formatDisplayText(status)}</span>;
}

export function MetricCard({ label, value, helper, trend }: { label: string; value: string | number; helper: string; trend?: string }) {
  return <article className="panel-card panel-card-hover p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{value}</p></div>{trend ? <span className="w-fit rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-300">{trend}</span> : null}</div><p className="mt-2 text-sm leading-6 text-zinc-400">{helper}</p></article>;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="panel-card p-6 text-center sm:p-8"><h3 className="text-lg font-semibold text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p></div>;
}

export function StatsGrid({ items, className = 'metric-grid' }: { items: Array<{ eyebrow: string; title: string; description: string; tone?: 'default' | 'success' | 'warning' | 'danger' }>; className?: string }) {
  return <div className={className}>{items.map((item) => <InfoPanel key={`${item.eyebrow}-${item.title}`} eyebrow={item.eyebrow} title={item.title} description={item.description} tone={item.tone} />)}</div>;
}

export function LoadingState({ label }: { label: string }) {
  return <div className="panel-card p-5 sm:p-6"><div className="flex items-center gap-3 text-sm text-zinc-400"><span className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-blue-400" />{label}</div></div>;
}

export function ErrorState({ message }: { message: string }) {
  return <div className="rounded-[20px] border border-rose-500/20 bg-rose-500/10 p-4 text-rose-200 sm:p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-300">Error</p><p className="mt-2 text-sm leading-6">{message}</p></div>;
}

export function DataTable({ columns, rows }: { columns: string[]; rows: ReactNode[][] }) {
  if (rows.length === 0) {
    return <EmptyState title="Sin registros disponibles" description="Todavía no hay datos para mostrar en este módulo operativo." />;
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:hidden">
        {rows.map((row, rowIndex) => (
          <article key={rowIndex} className="surface-muted p-4">
            <div className="grid gap-3">
              {row.map((cell, cellIndex) => (
                <div key={cellIndex} className="grid gap-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{columns[cellIndex]}</p>
                  <div className="min-w-0 break-words text-sm leading-6 text-zinc-200">{cell}</div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-[18px] border border-white/8 bg-[#0f1117] md:block">
        <div className="scrollbar-dark overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[640px] table-auto text-left text-sm md:min-w-[720px]">
            <thead className="bg-white/[0.03]">
              <tr>
                {columns.map((column) => (
                  <th key={column} className="px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 sm:px-4">
                    <div className="min-w-0 whitespace-nowrap">{column}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-t border-white/6">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-3 py-3 align-top text-zinc-200 sm:px-4">
                      <div className="min-w-0 max-w-[18rem] break-words text-sm leading-6 sm:max-w-[20rem] lg:max-w-none">{cell}</div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function AgentCard({ title, description, status, meta }: { title: string; description: string; status: string; meta: string }) {
  return <article className="panel-card p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><h3 className="text-base font-semibold text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p></div><StatusBadge status={status} /></div><div className="mt-4 border-t border-white/8 pt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">{meta}</div></article>;
}

export function SkillCard({ title, type, description }: { title: string; type: string; description: string }) {
  return <article className="panel-card p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><h3 className="text-base font-semibold text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p></div><StatusBadge status={type} /></div></article>;
}

export function TaskStatusTimeline({ status, startedAt, completedAt }: { status: string; startedAt?: string | null; completedAt?: string | null }) {
  const items = [{ label: 'Estado', value: status, badge: true }, { label: 'Inicio', value: startedAt ?? 'Pendiente' }, { label: 'Fin', value: completedAt ?? 'Sin finalizar' }];
  return <div className="panel-card p-4"><h3 className="text-base font-semibold text-white">Línea de tiempo</h3><div className="mt-4 space-y-3">{items.map((item) => <div key={item.label} className="flex flex-col gap-2 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm font-medium text-zinc-400">{item.label}</p><div className="text-left text-sm text-zinc-200 sm:text-right">{item.badge ? <StatusBadge status={item.value} /> : item.value}</div></div>)}</div></div>;
}

export function RunLogViewer({ logs }: { logs: string }) {
  return <div className="panel-card p-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><h3 className="text-base font-semibold text-white">Registro de ejecución</h3><StatusBadge status="logs" /></div><pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-words rounded-[18px] border border-white/8 bg-black/20 p-4 text-xs leading-6 text-zinc-300">{logs}</pre></div>;
}

export function ApprovalPanel({ children }: { children: ReactNode }) {
  return <div className="panel-card min-w-0 p-4">{children}</div>;
}

export function CommandConsole({ children }: { children: ReactNode }) {
  return <div className="panel-card min-w-0 overflow-hidden p-4">{children}</div>;
}

export function ConnectionStatus({ status, label }: { status: string; label: string }) {
  return <div className="inline-flex max-w-full items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3"><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${status === 'connected' ? 'bg-emerald-400' : 'bg-rose-400'}`} /><span className="truncate text-sm font-medium text-zinc-200">{label}</span></div>;
}

export function ConfirmDialog({ title, description }: { title: string; description: string }) {
  return <div className="rounded-[18px] border border-amber-500/20 bg-amber-500/10 p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">Control</p><h3 className="mt-2 text-base font-semibold text-amber-100">{title}</h3><p className="mt-2 text-sm leading-6 text-amber-200/80">{description}</p></div>;
}

export function PageShell({ title, description, children, action }: { title: string; description: string; children: ReactNode; action?: ReactNode }) {
  return <section className="min-w-0 space-y-5"><div className="panel-card hero-panel p-5 sm:p-6"><div className="relative flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Espacio de trabajo</p><h2 className="mt-2 break-words text-[1.7rem] font-semibold tracking-tight text-white sm:text-[2rem]">{title}</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">{description}</p></div>{action ? <div className="w-full min-w-0 xl:w-auto xl:max-w-xl">{action}</div> : null}</div></div>{children}</section>;
}

export function SectionCard({ title, subtitle, children, action }: { title: string; subtitle?: string; children: ReactNode; action?: ReactNode }) {
  return <section className="panel-card min-w-0 p-4"><div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div className="min-w-0"><h3 className="break-words text-base font-semibold text-white">{title}</h3>{subtitle ? <p className="mt-1 text-sm leading-6 text-zinc-400">{subtitle}</p> : null}</div>{action ? <div className="w-full min-w-0 md:w-auto">{action}</div> : null}</div>{children}</section>;
}

export function InfoPanel({ eyebrow, title, description, tone = 'default' }: { eyebrow: string; title: string; description: string; tone?: 'default' | 'success' | 'warning' | 'danger' }) {
  const tones = { default: 'border-white/8 bg-white/[0.03]', success: 'border-emerald-500/15 bg-emerald-500/10', warning: 'border-amber-500/15 bg-amber-500/10', danger: 'border-rose-500/15 bg-rose-500/10' };
  return <div className={`min-w-0 rounded-[18px] border p-4 ${tones[tone]}`}><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{eyebrow}</p><h4 className="mt-3 break-words text-base font-semibold text-white">{title}</h4><p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p></div>;
}

export function MetricPill({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'info' | 'success' }) {
  const tones = { default: 'border-white/8 bg-white/[0.03] text-zinc-200', info: 'border-blue-500/20 bg-blue-500/10 text-blue-200', success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200' };
  return <div className={`min-w-0 rounded-2xl border px-3 py-2 ${tones[tone]}`}><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</p><p className="mt-1 break-words text-sm font-semibold">{formatDisplayText(value)}</p></div>;
}
