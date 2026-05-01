import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { requestLogger } from './middleware/request-logger.js';
import agentsRoutes from './routes/agents.routes.js';
import approvalsRoutes from './routes/approvals.routes.js';
import auditRoutes from './routes/audit.routes.js';
import mcpRoutes from './routes/mcp.routes.js';
import missionsRoutes from './routes/missions.routes.js';
import officesRoutes from './routes/offices.routes.js';
import runsRoutes from './routes/runs.routes.js';
import skillsRoutes from './routes/skills.routes.js';
import systemRoutes from './routes/system.routes.js';
import tasksRoutes from './routes/tasks.routes.js';
import workflowsRoutes from './routes/workflows.routes.js';
import workspacesRoutes from './routes/workspaces.routes.js';

export const app = express();

app.use(cors({ origin: env.frontendOrigin }));
app.use(express.json());
app.use(requestLogger);

app.use('/api/system', systemRoutes);
app.use('/api/agents', agentsRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/task-runs', runsRoutes);
app.use('/api/approvals', approvalsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/mcp', mcpRoutes);
app.use('/api/missions', missionsRoutes);
app.use('/api/offices', officesRoutes);
app.use('/api/workflows', workflowsRoutes);
app.use('/api/workspaces', workspacesRoutes);

app.use(errorHandler);
