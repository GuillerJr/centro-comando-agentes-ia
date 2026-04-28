import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Activity,
  BadgeCheck,
  Blocks,
  Bot,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Clock3,
  Command,
  FolderKanban,
  GitBranchPlus,
  LayoutDashboard,
  Logs,
  Menu,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Waypoints,
} from 'lucide-react';

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: string;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/agents', label: 'Agents', icon: Bot, badge: '2' },
      { to: '/skills', label: 'Skills', icon: Sparkles, badge: '5' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { to: '/tasks', label: 'Tasks', icon: FolderKanban, badge: '2' },
      { to: '/runs', label: 'Runs', icon: Activity },
      { to: '/console', label: 'Console', icon: Command },
      { to: '/approvals', label: 'Approvals', icon: BadgeCheck, badge: '1' },
      { to: '/audit', label: 'Audit', icon: ShieldCheck },
    ],
  },
  {
    title: 'Platform',
    items: [
      { to: '/mcp', label: 'MCP', icon: Waypoints },
      { to: '/settings', label: 'Settings', icon: Settings2, badge: '3' },
    ],
  },
];

function statusTone(status: string) {
  const normalized = status.toLowerCase();

  if (
    normalized.includes('active') ||
    normalized.includes('completed') ||
    normalized.includes('connected') ||
    normalized.includes('approved') ||
    normalized.includes('success') ||
    normalized.includes('visible') ||
    normalized.includes('delivered')
  ) {
    return 'border-emerald-400/30 bg-emerald-500/10 text-emerald-700';
  }

  if (
    normalized.includes('pending') ||
    normalized.includes('running') ||
    normalized.includes('warning') ||
    normalized.includes('maintenance') ||
    normalized.includes('queued') ||
    normalized.includes('new')
  ) {
    return 'border-amber-400/30 bg-amber-500/10 text-amber-700';
  }

  if (normalized.includes('info')) {
    return 'border-sky-400/30 bg-sky-500/10 text-sky-700';
  }

  return 'border-rose-400/30 bg-rose-500/10 text-rose-700';
}

export function Sidebar({
  isOpen,
  isCollapsed,
  onClose,
  onToggleCollapse,
}: {
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}) {
  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-950/45 backdrop-blur-sm transition lg:hidden ${isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 border-r border-white/8 bg-[linear-gradient(180deg,#0f172a_0%,#121c33_50%,#101827_100%)] text-slate-100 transition-all duration-300 lg:sticky lg:top-0 lg:z-auto lg:translate-x-0 ${
          isCollapsed ? 'w-[6.25rem]' : 'w-[19rem]'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="relative flex h-screen flex-col overflow-hidden px-4 py-5">
          <div className="pointer-events-none absolute inset-x-4 top-3 h-32 rounded-[28px] bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.26),transparent_62%)]" />

          <div className="relative mb-6 flex items-center justify-between gap-3">
            <div className={`flex items-center ${isCollapsed ? 'w-full justify-center' : 'gap-3'}`}>
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-white text-slate-950 shadow-[0_18px_40px_rgba(15,23,42,0.35)]">
                <GitBranchPlus className="h-5 w-5" />
              </div>
              {!isCollapsed ? (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-400">HackTrickStore</p>
                  <h1 className="mt-1 text-lg font-semibold tracking-tight text-white">AI Command Center</h1>
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white lg:inline-flex"
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          {!isCollapsed ? (
            <div className="relative mb-5 rounded-[28px] border border-white/10 bg-white/[0.06] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-cyan-300 text-sm font-bold text-slate-950">
                  GJ
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">Guiller JR</p>
                  <p className="mt-1 text-xs text-slate-400">Control owner · orchestration</p>
                </div>
                <div className="mt-1 flex h-3 w-3 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(74,222,128,0.8)]" />
              </div>
            </div>
          ) : null}

          <div className="scrollbar-dark flex-1 overflow-y-auto pr-1">
            <div className="space-y-6">
              {navGroups.map((group) => (
                <div key={group.title}>
                  {!isCollapsed ? (
                    <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">{group.title}</p>
                  ) : (
                    <div className="mx-auto mb-3 h-px w-10 bg-white/10" />
                  )}

                  <nav className="grid gap-1.5">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                          `group rounded-[22px] px-3 py-3 transition ${
                            isActive
                              ? 'border border-white/10 bg-white text-slate-950 shadow-[0_20px_40px_rgba(15,23,42,0.35)]'
                              : 'border border-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.06] hover:text-white'
                          }`
                        }
                      >
                        {({ isActive }) => {
                          const Icon = item.icon;

                          return (
                            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between gap-3'}`}>
                              <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                                <div
                                  className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                                    isActive ? 'bg-slate-950 text-white' : 'bg-white/[0.06] text-slate-300'
                                  }`}
                                >
                                  <Icon className="h-4 w-4" />
                                </div>
                                {!isCollapsed ? <span className="text-sm font-medium">{item.label}</span> : null}
                              </div>

                              {!isCollapsed && item.badge ? (
                                <span
                                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                    isActive ? 'bg-slate-100 text-slate-700' : 'bg-white/[0.08] text-slate-300'
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              ) : null}
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

          <div className="mt-5 rounded-[28px] border border-cyan-400/20 bg-[linear-gradient(180deg,rgba(34,211,238,0.14),rgba(15,23,42,0.15))] p-4">
            {isCollapsed ? (
              <div className="flex justify-center text-cyan-300">
                <CircleDot className="h-4 w-4" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-white">Runtime synced</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">Connected operational layer</p>
                  </div>
                  <div className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(74,222,128,0.85)]" />
                </div>
                <div className="mt-4 h-2 rounded-full bg-white/10">
                  <div className="h-2 w-[78%] rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300" />
                </div>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

export function Topbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/90 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition hover:border-slate-300 hover:text-slate-900 lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Operations workspace</p>
            <h2 className="mt-1 text-[1.65rem] font-semibold tracking-tight text-slate-950">Multi-agent command center</h2>
          </div>
        </div>

        <div className="flex flex-col gap-3 xl:min-w-[640px] xl:flex-row xl:items-center xl:justify-end">
          <div className="flex min-h-[52px] flex-1 items-center gap-3 rounded-[24px] border border-slate-200/80 bg-slate-50/90 px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              className="w-full border-0 bg-transparent p-0 text-sm text-slate-700 outline-none placeholder:text-slate-400"
              placeholder="Search tasks, agents, skills, runs or logs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <MetricPill label="Runtime" value="Connected" tone="success" />
            <MetricPill label="Env" value="Production" tone="info" />
            <button className="inline-flex h-12 items-center gap-2 rounded-[22px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition hover:border-slate-300 hover:text-slate-950">
              <Logs className="h-4 w-4" />
              Live log
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${statusTone(status)}`}>
      {status}
    </span>
  );
}

export function MetricCard({
  label,
  value,
  helper,
  trend,
}: {
  label: string;
  value: string | number;
  helper: string;
  trend?: string;
}) {
  return (
    <article className="panel-card panel-card-hover p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{label}</p>
          <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
        </div>
        {trend ? <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600">{trend}</span> : null}
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-500">{helper}</p>
    </article>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="panel-card p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <Blocks className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="panel-card p-8">
      <div className="flex items-center gap-3 text-sm text-slate-600">
        <span className="inline-flex h-3 w-3 animate-pulse rounded-full bg-sky-500" />
        {label}
      </div>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-5 text-rose-700 shadow-[0_18px_35px_rgba(244,63,94,0.08)]">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-500">Operational error</p>
      <p className="mt-2 text-sm leading-6">{message}</p>
    </div>
  );
}

export function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
      <div className="scrollbar-light overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[linear-gradient(180deg,#f8fafc_0%,#f3f7fb_100%)]">
            <tr>
              {columns.map((column) => (
                <th key={column} className="whitespace-nowrap px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-t border-slate-100 transition hover:bg-slate-50/80">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-5 py-4 align-top text-slate-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AgentCard({
  title,
  description,
  status,
  meta,
}: {
  title: string;
  description: string;
  status: string;
  meta: string;
}) {
  return (
    <article className="panel-card panel-card-hover p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
          <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
        </div>
        <StatusBadge status={status} />
      </div>
      <div className="mt-5 border-t border-slate-100 pt-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{meta}</div>
    </article>
  );
}

export function SkillCard({ title, type, description }: { title: string; type: string; description: string }) {
  return (
    <article className="panel-card panel-card-hover p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
          <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
        </div>
        <StatusBadge status={type} />
      </div>
    </article>
  );
}

export function TaskStatusTimeline({
  status,
  startedAt,
  completedAt,
}: {
  status: string;
  startedAt?: string | null;
  completedAt?: string | null;
}) {
  const items = [
    { label: 'Status', value: status, badge: true, icon: CircleDot },
    { label: 'Started', value: startedAt ?? 'Pending', icon: Clock3 },
    { label: 'Completed', value: completedAt ?? 'Not finished', icon: BadgeCheck },
  ];

  return (
    <div className="panel-card p-5">
      <h3 className="text-lg font-semibold text-slate-950">Timeline</h3>
      <div className="mt-5 space-y-4">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.label} className="flex items-center justify-between gap-4 rounded-[22px] border border-slate-100 bg-slate-50/90 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-[0_8px_16px_rgba(15,23,42,0.05)]">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-sm font-medium text-slate-500">{item.label}</p>
              </div>
              <div className="text-right text-sm text-slate-800">{item.badge ? <StatusBadge status={item.value} /> : item.value}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RunLogViewer({ logs }: { logs: string }) {
  return (
    <div className="panel-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-950">Execution log</h3>
        <StatusBadge status="logs" />
      </div>
      <pre className="scrollbar-light mt-4 overflow-x-auto whitespace-pre-wrap rounded-[26px] border border-slate-100 bg-slate-50 p-4 text-xs leading-6 text-slate-600">
        {logs}
      </pre>
    </div>
  );
}

export function ApprovalPanel({ children }: { children: ReactNode }) {
  return <div className="panel-card p-5">{children}</div>;
}

export function CommandConsole({ children }: { children: ReactNode }) {
  return <div className="panel-card overflow-hidden p-5">{children}</div>;
}

export function ConnectionStatus({ status, label }: { status: string; label: string }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-[22px] border border-slate-200 bg-white px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
      <span
        className={`h-2.5 w-2.5 rounded-full ${
          status === 'connected'
            ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.45)]'
            : 'bg-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.45)]'
        }`}
      />
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </div>
  );
}

export function ConfirmDialog({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[28px] border border-amber-200 bg-[linear-gradient(180deg,rgba(254,243,199,0.95),rgba(255,251,235,0.95))] p-5 shadow-[0_16px_30px_rgba(245,158,11,0.08)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">Risk control</p>
      <h3 className="mt-2 text-lg font-semibold text-amber-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-amber-900/80">{description}</p>
    </div>
  );
}

export function PageShell({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="space-y-6">
      <div className="relative overflow-hidden rounded-[32px] border border-slate-200/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(241,247,253,0.92))] p-6 shadow-[0_28px_60px_rgba(15,23,42,0.08)] sm:p-7">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.15),transparent_55%)]" />
        <div className="relative flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Workspace</p>
            <h2 className="mt-2 text-[2rem] font-semibold tracking-tight text-slate-950 sm:text-[2.2rem]">{title}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">{description}</p>
          </div>
          {action ? <div className="relative xl:max-w-md">{action}</div> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

export function SectionCard({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="panel-card p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function InfoPanel({
  eyebrow,
  title,
  description,
  tone = 'default',
}: {
  eyebrow: string;
  title: string;
  description: string;
  tone?: 'default' | 'success' | 'warning' | 'danger';
}) {
  const tones = {
    default: 'border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#f3f7fb_100%)]',
    success: 'border-emerald-200 bg-[linear-gradient(180deg,#ecfdf5_0%,#f0fdf4_100%)]',
    warning: 'border-amber-200 bg-[linear-gradient(180deg,#fffbeb_0%,#fefce8_100%)]',
    danger: 'border-rose-200 bg-[linear-gradient(180deg,#fff1f2_0%,#fff7f7_100%)]',
  };

  return (
    <div className={`rounded-[24px] border p-5 ${tones[tone]}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{eyebrow}</p>
      <h4 className="mt-3 text-lg font-semibold text-slate-950">{title}</h4>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

export function MetricPill({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'info' | 'success';
}) {
  const tones = {
    default: 'border-slate-200 bg-white text-slate-700',
    info: 'border-sky-200 bg-sky-50 text-sky-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  };

  return (
    <div className={`rounded-[22px] border px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.04)] ${tones[tone]}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
