import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';

type NavItem = {
  to: string;
  label: string;
  short: string;
  badge?: string;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    title: 'Command',
    items: [
      { to: '/', label: 'Dashboard', short: '◫' },
      { to: '/agents', label: 'Agents', short: '◎', badge: '2' },
      { to: '/skills', label: 'Skills', short: '✦', badge: '5' },
    ],
  },
  {
    title: 'Execution',
    items: [
      { to: '/tasks', label: 'Tasks', short: '▣', badge: '2' },
      { to: '/runs', label: 'Runs', short: '↗' },
      { to: '/console', label: 'Console', short: '⌘' },
      { to: '/approvals', label: 'Approvals', short: '✓', badge: '1' },
      { to: '/audit', label: 'Audit', short: '◴' },
    ],
  },
  {
    title: 'Platform',
    items: [
      { to: '/mcp', label: 'MCP', short: '⌗' },
      { to: '/settings', label: 'Settings', short: '⚙', badge: '3' },
    ],
  },
];

function statusTone(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes('active') || normalized.includes('completed') || normalized.includes('connected') || normalized.includes('approved') || normalized.includes('success') || normalized.includes('visible')) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }
  if (normalized.includes('pending') || normalized.includes('running') || normalized.includes('warning') || normalized.includes('maintenance') || normalized.includes('queued')) {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }
  if (normalized.includes('info')) {
    return 'border-blue-200 bg-blue-50 text-blue-700';
  }
  return 'border-rose-200 bg-rose-50 text-rose-700';
}

export function Sidebar({ isOpen, isCollapsed, onClose, onToggleCollapse }: { isOpen: boolean; isCollapsed: boolean; onClose: () => void; onToggleCollapse: () => void }) {
  return (
    <>
      <div className={`fixed inset-0 z-30 bg-slate-900/25 backdrop-blur-sm transition ${isOpen ? 'pointer-events-auto opacity-100 lg:hidden' : 'pointer-events-none opacity-0'}`} onClick={onClose} />
      <aside className={`fixed inset-y-0 left-0 z-40 border-r border-slate-200/80 bg-white transition-all duration-300 lg:sticky lg:top-0 lg:z-auto lg:translate-x-0 ${isCollapsed ? 'w-[5.7rem]' : 'w-[17rem]'} ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex h-full flex-col px-4 py-5">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'gap-3'}`}>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)]">AI</div>
              {!isCollapsed ? (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">HackTrickStore</p>
                  <h1 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">Command Center</h1>
                </div>
              ) : null}
            </div>
            <button type="button" onClick={onToggleCollapse} className="hidden rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-900 lg:inline-flex">
              {isCollapsed ? '»' : '«'}
            </button>
          </div>

          {!isCollapsed ? (
            <div className="mb-6 rounded-[22px] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-sm font-bold text-blue-700">GJ</div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Guiller JR</p>
                  <p className="mt-1 text-xs text-slate-500">Multi-agent control owner</p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6">
              {navGroups.map((group) => (
                <div key={group.title}>
                  {!isCollapsed ? <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{group.title}</p> : <div className="mx-auto mb-3 h-px w-8 bg-slate-200" />}
                  <nav className="grid gap-1.5">
                    {group.items.map((item) => (
                      <NavLink key={item.to} to={item.to} className={({ isActive }) => `group rounded-2xl px-3 py-3 transition ${isActive ? 'bg-slate-950 text-white shadow-[0_12px_24px_rgba(15,23,42,0.12)]' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                        {({ isActive }) => (
                          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between gap-3'}`}>
                            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                              <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold ${isActive ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                {item.short}
                              </div>
                              {!isCollapsed ? <span className="text-sm font-medium">{item.label}</span> : null}
                            </div>
                            {!isCollapsed && item.badge ? <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${isActive ? 'bg-white/10 text-white' : 'bg-slate-200 text-slate-500'}`}>{item.badge}</span> : null}
                          </div>
                        )}
                      </NavLink>
                    ))}
                  </nav>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-[22px] border border-slate-200 bg-slate-50 p-3">
            {isCollapsed ? (
              <div className="flex justify-center text-slate-500">●</div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-900">OpenClaw Runtime</p>
                  <p className="mt-1 text-xs text-slate-500">Connected operational layer</p>
                </div>
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.45)]" />
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

export function Topbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/90 px-6 py-4 backdrop-blur-xl">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-4">
          <button type="button" onClick={onToggleSidebar} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:text-slate-900 lg:hidden">☰</button>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Operations workspace</p>
            <h2 className="mt-1 text-[1.6rem] font-semibold tracking-tight text-slate-900">Multi-agent command center</h2>
          </div>
        </div>

        <div className="flex flex-col gap-3 xl:min-w-[560px] xl:flex-row xl:items-center xl:justify-end">
          <div className="flex min-h-[48px] flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4">
            <span className="text-slate-400">⌕</span>
            <input className="w-full border-0 bg-transparent p-0 text-sm text-slate-700 outline-none placeholder:text-slate-400" placeholder="Search tasks, agents, skills, runs or logs" />
          </div>
          <div className="flex items-center gap-3">
            <MetricPill label="Runtime" value="Connected" tone="success" />
            <MetricPill label="Env" value="Production" tone="default" />
          </div>
        </div>
      </div>
    </header>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${statusTone(status)}`}>{status}</span>;
}

export function MetricCard({ label, value, helper }: { label: string; value: string | number; helper: string }) {
  return <article className="panel-card p-5"><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p><p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">{value}</p><p className="mt-3 text-sm leading-6 text-slate-500">{helper}</p></article>;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="panel-card p-8 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">Ø</div><h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p></div>;
}

export function LoadingState({ label }: { label: string }) {
  return <div className="panel-card p-8"><div className="flex items-center gap-3 text-sm text-slate-600"><span className="inline-flex h-3 w-3 animate-pulse rounded-full bg-blue-500" />{label}</div></div>;
}

export function ErrorState({ message }: { message: string }) {
  return <div className="rounded-[26px] border border-rose-200 bg-rose-50 p-5 text-rose-700 shadow-[0_12px_26px_rgba(244,63,94,0.08)]"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-500">Error operativo</p><p className="mt-2 text-sm leading-6">{message}</p></div>;
}

export function DataTable({ columns, rows }: { columns: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_12px_24px_rgba(15,23,42,0.04)]">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>{columns.map((column) => <th key={column} className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{column}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-t border-slate-100 transition hover:bg-slate-50/80">
                {row.map((cell, cellIndex) => <td key={cellIndex} className="px-5 py-4 align-top text-slate-700">{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AgentCard({ title, description, status, meta }: { title: string; description: string; status: string; meta: string }) {
  return <article className="panel-card p-5"><div className="flex items-start justify-between gap-4"><div><h3 className="text-lg font-semibold text-slate-900">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-500">{description}</p></div><StatusBadge status={status} /></div><div className="mt-5 border-t border-slate-100 pt-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{meta}</div></article>;
}

export function SkillCard({ title, type, description }: { title: string; type: string; description: string }) {
  return <article className="panel-card p-5"><div className="flex items-start justify-between gap-4"><div><h3 className="text-lg font-semibold text-slate-900">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-500">{description}</p></div><StatusBadge status={type} /></div></article>;
}

export function TaskStatusTimeline({ status, startedAt, completedAt }: { status: string; startedAt?: string | null; completedAt?: string | null }) {
  const items = [{ label: 'Estado', value: status, badge: true }, { label: 'Inicio', value: startedAt ?? 'Pendiente' }, { label: 'Fin', value: completedAt ?? 'Sin finalizar' }];
  return <div className="panel-card p-5"><h3 className="text-lg font-semibold text-slate-900">Timeline</h3><div className="mt-5 space-y-4">{items.map((item) => <div key={item.label} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4"><p className="text-sm font-medium text-slate-500">{item.label}</p><div className="text-right text-sm text-slate-800">{item.badge ? <StatusBadge status={item.value} /> : item.value}</div></div>)}</div></div>;
}

export function RunLogViewer({ logs }: { logs: string }) {
  return <div className="panel-card p-5"><div className="flex items-center justify-between gap-3"><h3 className="text-lg font-semibold text-slate-900">Execution log</h3><StatusBadge status="logs" /></div><pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-3xl border border-slate-100 bg-slate-50 p-4 text-xs leading-6 text-slate-600">{logs}</pre></div>;
}

export function ApprovalPanel({ children }: { children: ReactNode }) {
  return <div className="panel-card p-5">{children}</div>;
}

export function CommandConsole({ children }: { children: ReactNode }) {
  return <div className="panel-card overflow-hidden p-5">{children}</div>;
}

export function ConnectionStatus({ status, label }: { status: string; label: string }) {
  return <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_12px_24px_rgba(15,23,42,0.04)]"><span className={`h-2.5 w-2.5 rounded-full ${status === 'connected' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.45)]' : 'bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.45)]'}`} /><span className="text-sm font-medium text-slate-700">{label}</span></div>;
}

export function ConfirmDialog({ title, description }: { title: string; description: string }) {
  return <div className="rounded-[22px] border border-amber-200 bg-amber-50 p-5 shadow-[0_12px_24px_rgba(245,158,11,0.06)]"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-500">Control de riesgo</p><h3 className="mt-2 text-lg font-semibold text-amber-900">{title}</h3><p className="mt-2 text-sm leading-6 text-amber-800/80">{description}</p></div>;
}

export function PageShell({ title, description, children, action }: { title: string; description: string; children: ReactNode; action?: ReactNode }) {
  return <section className="space-y-6"><div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between"><div><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Workspace</p><h2 className="mt-2 text-[2rem] font-semibold tracking-tight text-slate-900">{title}</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">{description}</p></div>{action ? <div className="xl:max-w-md">{action}</div> : null}</div>{children}</section>;
}

export function SectionCard({ title, subtitle, children, action }: { title: string; subtitle?: string; children: ReactNode; action?: ReactNode }) {
  return <section className="panel-card p-5"><div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><h3 className="text-lg font-semibold text-slate-900">{title}</h3>{subtitle ? <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p> : null}</div>{action}</div>{children}</section>;
}

export function InfoPanel({ eyebrow, title, description, tone = 'default' }: { eyebrow: string; title: string; description: string; tone?: 'default' | 'success' | 'warning' | 'danger' }) {
  const tones = { default: 'border-slate-200 bg-slate-50', success: 'border-emerald-200 bg-emerald-50', warning: 'border-amber-200 bg-amber-50', danger: 'border-rose-200 bg-rose-50' };
  return <div className={`rounded-[20px] border p-5 ${tones[tone]}`}><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{eyebrow}</p><h4 className="mt-3 text-lg font-semibold text-slate-900">{title}</h4><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p></div>;
}

export function MetricPill({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'info' | 'success' }) {
  const tones = { default: 'border-slate-200 bg-white text-slate-700', info: 'border-blue-200 bg-blue-50 text-blue-700', success: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
  return <div className={`rounded-2xl border px-4 py-3 ${tones[tone]}`}><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>;
}
