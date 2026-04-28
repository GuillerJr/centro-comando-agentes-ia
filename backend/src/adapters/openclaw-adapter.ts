import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';

const execFileAsync = promisify(execFile);

type AdapterTaskPayload = {
  title: string;
  description: string;
  requestedAction: string;
};

type AdapterRunPayload = {
  taskId: string;
  requestedAction: string;
};

function parseOpenClawStatusOutput(rawOutput: string) {
  return {
    raw: rawOutput.trim(),
    connected: rawOutput.toLowerCase().includes('running') || rawOutput.toLowerCase().includes('ok'),
  };
}

async function runWhitelistedCommand(command: string[]) {
  const joinedCommand = command.join(' ').trim();
  if (!env.openClawAllowedCommands.includes(joinedCommand)) {
    throw new AppError(`Command not allowed by whitelist: ${joinedCommand}`, 409);
  }

  try {
    const { stdout, stderr } = await execFileAsync(env.openClawCliPath, command, {
      timeout: 15000,
      env: {
        ...process.env,
        HOME: process.env.HOME ?? '/home/ubuntu',
        PATH: process.env.PATH,
      },
    });
    return { stdout, stderr };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown OpenClaw CLI error';
    throw new AppError(`OpenClaw CLI command failed (${joinedCommand}): ${message}`, 502);
  }
}

export interface OpenClawAdapter {
  getStatus(): Promise<any>;
  listAgents(): Promise<any[]>;
  listSkills(): Promise<any[]>;
  createTask(payload: AdapterTaskPayload): Promise<any>;
  runTask(payload: AdapterRunPayload): Promise<any>;
  getTaskStatus(taskId: string): Promise<any>;
  getLogs(): Promise<any[]>;
  stopTask(taskId: string): Promise<any>;
  validateConnection(): Promise<any>;
}

class MockOpenClawAdapter implements OpenClawAdapter {
  async getStatus() {
    return {
      mode: 'mock',
      state: 'connected',
      gateway: { status: 'mock-online' },
      metrics: { estimatedConsumption: 12, pendingActions: 1 },
    };
  }
  async listAgents() {
    return [
      { name: 'Mock Orchestrator', type: 'orchestrator', status: 'active' },
      { name: 'Mock Executor', type: 'executor', status: 'active' },
    ];
  }
  async listSkills() {
    return [
      { canonicalName: 'agent-skill-governance', type: 'governance' },
      { canonicalName: 'fullstack-feature-builder', type: 'fullstack' },
    ];
  }
  async createTask(payload: AdapterTaskPayload) {
    return { externalTaskId: `mock-${Date.now()}`, status: 'created', payload };
  }
  async runTask(payload: AdapterRunPayload) {
    return { taskId: payload.taskId, status: 'completed', output: 'Mock run completed successfully.' };
  }
  async getTaskStatus(taskId: string) {
    return { taskId, status: 'completed' };
  }
  async getLogs() {
    return [{ timestamp: new Date().toISOString(), level: 'info', message: 'Mock OpenClaw log stream.' }];
  }
  async stopTask(taskId: string) {
    return { taskId, status: 'cancelled' };
  }
  async validateConnection() {
    return { valid: true, mode: 'mock' };
  }
}

class CliOpenClawAdapter implements OpenClawAdapter {
  async getStatus() {
    try {
      const { stdout, stderr } = await runWhitelistedCommand(['status']);
      return {
        mode: 'cli',
        state: parseOpenClawStatusOutput(`${stdout}\n${stderr}`).connected ? 'connected' : 'degraded',
        details: parseOpenClawStatusOutput(`${stdout}\n${stderr}`),
      };
    } catch {
      const response = await fetch(`${env.openClawApiUrl}/health`);
      if (!response.ok) {
        return { mode: 'cli', state: 'disconnected', details: { reason: 'CLI status failed and gateway health was unavailable' } };
      }
      const data = await response.json();
      return { mode: 'cli', state: data.ok ? 'connected' : 'degraded', details: { fallback: 'gateway-health', data } };
    }
  }
  async listAgents() {
    return [{ name: 'OpenClaw CLI Session', type: 'executor', status: 'active' }];
  }
  async listSkills() {
    return [];
  }
  async createTask(payload: AdapterTaskPayload) {
    return { externalTaskId: `cli-${Date.now()}`, status: 'registered', payload };
  }
  async runTask(payload: AdapterRunPayload) {
    const { stdout, stderr } = await runWhitelistedCommand(['status']);
    return {
      taskId: payload.taskId,
      status: 'completed',
      output: `${stdout}${stderr}`.trim() || 'OpenClaw status executed via CLI.',
    };
  }
  async getTaskStatus(taskId: string) {
    return { taskId, status: 'unknown-via-cli', note: 'CLI mode does not expose task status API in this adapter version.' };
  }
  async getLogs() {
    return [{ timestamp: new Date().toISOString(), level: 'info', message: 'CLI adapter does not stream logs directly, using synthetic operational log.' }];
  }
  async stopTask(taskId: string) {
    return { taskId, status: 'unsupported', note: 'Stop task not available through whitelisted CLI commands.' };
  }
  async validateConnection() {
    try {
      const { stdout, stderr } = await runWhitelistedCommand(['gateway', 'status']);
      return { valid: true, mode: 'cli', output: `${stdout}${stderr}`.trim() };
    } catch {
      const response = await fetch(`${env.openClawApiUrl}/health`);
      return { valid: response.ok, mode: 'cli', fallback: 'gateway-health' };
    }
  }
}

class ApiOpenClawAdapter implements OpenClawAdapter {
  async getStatus() {
    const response = await fetch(`${env.openClawApiUrl}/health`);
    if (!response.ok) throw new AppError('OpenClaw API health check failed', 502);
    const data = await response.json();
    return { mode: 'api', state: data.ok ? 'connected' : 'degraded', details: data };
  }
  async listAgents() { return []; }
  async listSkills() { return []; }
  async createTask(payload: AdapterTaskPayload) { return { externalTaskId: `api-${Date.now()}`, status: 'not-implemented', payload }; }
  async runTask(payload: AdapterRunPayload) { return { taskId: payload.taskId, status: 'not-implemented', output: 'API mode prepared with verified health endpoint only.' }; }
  async getTaskStatus(taskId: string) { return { taskId, status: 'unknown' }; }
  async getLogs() { return [{ timestamp: new Date().toISOString(), level: 'warning', message: 'API mode only validates health in this environment.' }]; }
  async stopTask(taskId: string) { return { taskId, status: 'unsupported' }; }
  async validateConnection() {
    const response = await fetch(`${env.openClawApiUrl}/health`);
    return { valid: response.ok, mode: 'api' };
  }
}

export function createOpenClawAdapter(mode = env.openClawMode): OpenClawAdapter {
  if (mode === 'cli') return new CliOpenClawAdapter();
  if (mode === 'api') return new ApiOpenClawAdapter();
  return new MockOpenClawAdapter();
}
