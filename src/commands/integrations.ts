import { ApiClient } from '../api';
import { getConfig } from '../config';

export async function listIntegrations(args: { business: string }) {
  const config = getConfig();
  const api = new ApiClient(config);

  try {
    const result = await api.listIntegrations(args.business);
    console.log(JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error('Failed to list integrations:', error.message);
    process.exit(1);
  }
}

export async function listCampaigns(args: { business: string; id: string }) {
  const config = getConfig();
  const api = new ApiClient(config);

  if (!args.id) {
    console.error('Integration ID is required.');
    process.exit(1);
  }

  try {
    const result = await api.listCampaigns(args.business, args.id);
    console.log(JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error('Failed to list campaigns:', error.message);
    process.exit(1);
  }
}
