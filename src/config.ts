import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

export interface Config {
  // Legacy / manual API key (also sourced from MAX_API_KEY).
  apiKey?: string;
  // OAuth device-flow tokens.
  accessToken?: string;
  refreshToken?: string;
  // Epoch milliseconds when the access token expires.
  expiresAt?: number;
  tokenType?: string;
}

const CONFIG_DIR = join(homedir(), '.max');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export function getConfigPath(): string {
  return CONFIG_FILE;
}

export function saveConfig(config: Config): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  }
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n', { mode: 0o600 });
}

export function loadSavedConfig(): Config | null {
  if (!existsSync(CONFIG_FILE)) return null;
  try {
    const data = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
    const config: Config = {};
    if (typeof data.apiKey === 'string') config.apiKey = data.apiKey;
    if (typeof data.accessToken === 'string') config.accessToken = data.accessToken;
    if (typeof data.refreshToken === 'string') config.refreshToken = data.refreshToken;
    if (typeof data.expiresAt === 'number') config.expiresAt = data.expiresAt;
    if (typeof data.tokenType === 'string') config.tokenType = data.tokenType;
    if (config.apiKey || config.accessToken) return config;
  } catch {}
  return null;
}

export function clearConfig(): boolean {
  if (existsSync(CONFIG_FILE)) {
    unlinkSync(CONFIG_FILE);
    return true;
  }
  return false;
}

/** Returns true when a usable credential (env key, OAuth token, or legacy key) exists. */
export function hasCredentials(): boolean {
  if (process.env.MAX_API_KEY) return true;
  const saved = loadSavedConfig();
  return !!(saved && (saved.accessToken || saved.apiKey));
}

/**
 * Resolves the active credential. The MAX_API_KEY environment variable
 * always wins, followed by saved OAuth tokens or a legacy saved API key.
 * Exits with a helpful message when nothing is configured.
 */
export function getConfig(): Config {
  const envKey = process.env.MAX_API_KEY;
  if (envKey) return { apiKey: envKey };

  const saved = loadSavedConfig();
  if (saved) return saved;

  console.error('Error: Not authenticated.');
  console.error('Run "max login" to connect, or set MAX_API_KEY in your environment.');
  process.exit(1);
}
