import 'dotenv/config';

const requiredEnv = ['DATABASE_URL'] as const;

for (const envKey of requiredEnv) {
  if (!process.env[envKey]) {
    throw new Error(`Missing required environment variable: ${envKey}`);
  }
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL!,
  nodeEnv: process.env.NODE_ENV ?? 'development',
  openClawMode: (process.env.OPENCLAW_MODE ?? 'mock') as 'mock' | 'api' | 'cli',
  openClawApiUrl: process.env.OPENCLAW_API_URL ?? 'http://127.0.0.1:18789',
  openClawCliPath: process.env.OPENCLAW_CLI_PATH ?? 'openclaw',
  openClawAllowedCommands: (process.env.OPENCLAW_ALLOWED_COMMANDS ?? 'status,gateway status').split(',').map((value) => value.trim()).filter(Boolean),
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
};
