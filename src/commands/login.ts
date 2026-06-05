import { SignalsAPI } from '../api';
import { clearConfig, getConfigPath, loadSavedConfig, saveConfig } from '../config';
import { openBrowser, pollForToken, requestDeviceCode, revokeToken } from '../oauth';

export async function login() {
  process.stderr.write('\n  Signals CLI — Login\n\n');

  let device;
  try {
    device = await requestDeviceCode();
  } catch (error: any) {
    console.error(`  ${error.message}`);
    process.exit(1);
  }

  const target = device.verificationUriComplete || device.verificationUri;

  process.stderr.write(`  Your verification code:  ${device.userCode}\n\n`);
  process.stderr.write(`  Opening your browser to confirm it:\n  ${target}\n\n`);
  process.stderr.write(`  If the browser doesn't open, go to ${device.verificationUri}\n`);
  process.stderr.write(`  and enter the code above.\n\n`);

  openBrowser(target);

  process.stderr.write('  Waiting for you to confirm in the browser… ');

  let tokens;
  try {
    tokens = await pollForToken(device);
  } catch (error: any) {
    process.stderr.write('FAILED\n\n');
    console.error(`  ${error.message}`);
    process.exit(1);
  }

  // Persist only the OAuth tokens, dropping any stale legacy API key.
  saveConfig({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: tokens.expiresAt,
    tokenType: tokens.tokenType,
  });

  process.stderr.write('OK\n\n');
  process.stderr.write('  Connected successfully.\n');

  try {
    const api = new SignalsAPI(loadSavedConfig()!);
    const result: any = await api.listBusinesses();
    const count = result?.businesses?.length ?? 0;
    process.stderr.write(`  ${count} business${count !== 1 ? 'es' : ''} available to your account.\n`);
  } catch {
    // Connection succeeded; a failed verification call is non-fatal.
  }

  process.stderr.write(`  Config saved to ${getConfigPath()}\n\n`);
}

export async function logout() {
  const saved = loadSavedConfig();

  if (saved?.accessToken) {
    await revokeToken(saved.accessToken);
  }

  if (clearConfig()) {
    process.stderr.write('Logged out. Saved credentials removed.\n');
  } else {
    process.stderr.write('No saved credentials found.\n');
  }
}
