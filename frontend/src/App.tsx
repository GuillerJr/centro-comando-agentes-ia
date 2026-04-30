import { Suspense, lazy, useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Sidebar, Topbar } from './components/ui';

const AgentsPage = lazy(() => import('./pages/AgentsPage').then((module) => ({ default: module.AgentsPage })));
const ApprovalsPage = lazy(() => import('./pages/ApprovalsPage').then((module) => ({ default: module.ApprovalsPage })));
const AuditPage = lazy(() => import('./pages/AuditPage').then((module) => ({ default: module.AuditPage })));
const CommandConsolePage = lazy(() => import('./pages/CommandConsolePage').then((module) => ({ default: module.CommandConsolePage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const McpPage = lazy(() => import('./pages/McpPage').then((module) => ({ default: module.McpPage })));
const MissionDetailPage = lazy(() => import('./pages/MissionDetailPage').then((module) => ({ default: module.MissionDetailPage })));
const MissionsPage = lazy(() => import('./pages/MissionsPage').then((module) => ({ default: module.MissionsPage })));
const OfficeDesignPage = lazy(() => import('./pages/OfficeDesignPage').then((module) => ({ default: module.OfficeDesignPage })));
const RunsPage = lazy(() => import('./pages/RunsPage').then((module) => ({ default: module.RunsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((module) => ({ default: module.SettingsPage })));
const SkillsPage = lazy(() => import('./pages/SkillsPage').then((module) => ({ default: module.SkillsPage })));
const TaskDetailPage = lazy(() => import('./pages/TaskDetailPage').then((module) => ({ default: module.TaskDetailPage })));
const TasksPage = lazy(() => import('./pages/TasksPage').then((module) => ({ default: module.TasksPage })));

function RouteFallback() {
  return (
    <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-5 py-6 text-sm text-zinc-400">
      Cargando módulo...
    </div>
  );
}

export function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-transparent lg:flex">
      <Sidebar
        isOpen={isSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        onClose={() => setIsSidebarOpen(false)}
        onToggleCollapse={() => setIsSidebarCollapsed((current) => !current)}
      />
      <div className="min-w-0 flex-1">
        <Topbar onToggleSidebar={() => setIsSidebarOpen((current) => !current)} />
        <main className="scrollbar-light px-4 py-5 sm:px-6 lg:h-[calc(100vh-76px)] lg:overflow-y-auto lg:px-7">
          <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-5 pb-8">
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/office-design" element={<OfficeDesignPage />} />
                <Route path="/missions" element={<MissionsPage />} />
                <Route path="/missions/:missionId" element={<MissionDetailPage />} />
                <Route path="/agents" element={<AgentsPage />} />
                <Route path="/skills" element={<SkillsPage />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/tasks/:taskId" element={<TaskDetailPage />} />
                <Route path="/runs" element={<RunsPage />} />
                <Route path="/console" element={<CommandConsolePage />} />
                <Route path="/approvals" element={<ApprovalsPage />} />
                <Route path="/audit" element={<AuditPage />} />
                <Route path="/mcp" element={<McpPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
