import { spawn } from 'child_process';
import fetch from 'node-fetch';

const DEVICE_CODE_GRANT = 'urn:ietf:params:oauth:grant-type:device_code';

export interface DeviceCodeResponse {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  verificationUriComplete?: string;
  expiresIn: number;
  interval: number;
}

export interface TokenSet {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  tokenType: string;
}

/** Base URL of the OAuth/authorization server (the web app). */
export function oauthBaseUrl(): string {
  return (process.env.MAX_OAUTH_URL || 'https://yourmax.ai').replace(/\/$/, '');
}

/** Public client_id baked into the CLI; overridable for self-hosted setups. */
export function clientId(): string {
  return process.env.MAX_CLI_CLIENT_ID || 'max-cli';
}

async function parseJson(response: import('node-fetch').Response): Promise<any> {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { error: 'invalid_response', error_description: text };
  }
}

function toTokenSet(json: any): TokenSet {
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    tokenType: json.token_type || 'Bearer',
    expiresAt: typeof json.expires_in === 'number' ? Date.now() + json.expires_in * 1000 : undefined,
  };
}

/** Step 1: request a device + user code from the authorization server. */
export async function requestDeviceCode(scope = 'read'): Promise<DeviceCodeResponse> {
  const response = await fetch(`${oauthBaseUrl()}/oauth/authorize_device`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({ client_id: clientId(), scope }).toString(),
  });

  const json = await parseJson(response);
  if (!response.ok || !json.device_code) {
    const detail = json.error_description || json.error || `HTTP ${response.status}`;
    throw new Error(`Could not start device authorization: ${detail}`);
  }

  return {
    deviceCode: json.device_code,
    userCode: json.user_code,
    verificationUri: json.verification_uri,
    verificationUriComplete: json.verification_uri_complete,
    expiresIn: json.expires_in ?? 600,
    interval: json.interval ?? 5,
  };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Step 2: poll the token endpoint until the user authorizes (or the request
 * is denied / expires), per RFC 8628 §3.5.
 */
export async function pollForToken(device: DeviceCodeResponse): Promise<TokenSet> {
  let intervalMs = device.interval * 1000;
  const deadline = Date.now() + device.expiresIn * 1000;

  while (Date.now() < deadline) {
    await sleep(intervalMs);

    const response = await fetch(`${oauthBaseUrl()}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({
        grant_type: DEVICE_CODE_GRANT,
        device_code: device.deviceCode,
        client_id: clientId(),
      }).toString(),
    });

    const json = await parseJson(response);

    if (response.ok && json.access_token) {
      return toTokenSet(json);
    }

    switch (json.error) {
      case 'authorization_pending':
        break;
      case 'slow_down':
        intervalMs += 5000;
        break;
      case 'access_denied':
        throw new Error('Access was denied in the browser.');
      case 'expired_token':
        throw new Error('The verification code expired. Please run "max login" again.');
      default:
        throw new Error(`Authorization failed: ${json.error_description || json.error || `HTTP ${response.status}`}`);
    }
  }

  throw new Error('Timed out waiting for authorization. Please run "max login" again.');
}

/** Exchange a refresh token for a fresh access token. */
export async function refreshAccessToken(refreshToken: string): Promise<TokenSet> {
  const response = await fetch(`${oauthBaseUrl()}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId(),
    }).toString(),
  });

  const json = await parseJson(response);
  if (!response.ok || !json.access_token) {
    const detail = json.error_description || json.error || `HTTP ${response.status}`;
    throw new Error(`Could not refresh session: ${detail}`);
  }

  return toTokenSet(json);
}

/** Best-effort token revocation (used by `max logout`). */
export async function revokeToken(token: string): Promise<void> {
  try {
    await fetch(`${oauthBaseUrl()}/oauth/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({ token, client_id: clientId() }).toString(),
    });
  } catch {
    // Revocation is best-effort; ignore network/endpoint errors.
  }
}

/** Open a URL in the user's default browser without adding a dependency. */
export function openBrowser(url: string): void {
  const platform = process.platform;
  let command: string;
  let args: string[];

  if (platform === 'darwin') {
    command = 'open';
    args = [url];
  } else if (platform === 'win32') {
    command = 'cmd';
    args = ['/c', 'start', '""', url];
  } else {
    command = 'xdg-open';
    args = [url];
  }

  try {
    const child = spawn(command, args, { stdio: 'ignore', detached: true });
    child.on('error', () => {});
    child.unref();
  } catch {
    // If we can't launch a browser (e.g. headless), the caller still printed
    // the verification URL for the user to open manually.
  }
}
