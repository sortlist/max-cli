import { ApiClient } from '../api';
import { getConfig } from '../config';

export async function listSignals() {
  const config = getConfig();
  const api = new ApiClient(config);

  try {
    const result = await api.listSignals();
    console.log(JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error('Failed to list signals:', error.message);
    process.exit(1);
  }
}

export async function getSignal(args: { slug: string }) {
  const config = getConfig();
  const api = new ApiClient(config);

  if (!args.slug) {
    console.error('Signal slug is required.');
    process.exit(1);
  }

  try {
    const result = await api.getSignal(args.slug);
    console.log(JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error('Failed to get signal:', error.message);
    process.exit(1);
  }
}
