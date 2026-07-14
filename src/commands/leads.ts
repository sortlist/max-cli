import { ApiClient } from '../api';
import { getConfig } from '../config';

export async function listLeads(args: { business: string; page?: number; 'per-page'?: number }) {
  const config = getConfig();
  const api = new ApiClient(config);

  try {
    const result = await api.listLeads(args.business, {
      page: args.page,
      per_page: args['per-page'],
    });
    console.log(JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error('Failed to list leads:', error.message);
    process.exit(1);
  }
}

export async function getLead(args: { business: string; id: string }) {
  const config = getConfig();
  const api = new ApiClient(config);

  if (!args.id) {
    console.error('Lead ID is required.');
    process.exit(1);
  }

  try {
    const result = await api.getLead(args.business, args.id);
    console.log(JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error('Failed to get lead:', error.message);
    process.exit(1);
  }
}

export async function deleteLead(args: { business: string; id: string }) {
  const config = getConfig();
  const api = new ApiClient(config);

  if (!args.id) {
    console.error('Lead ID is required.');
    process.exit(1);
  }

  try {
    await api.deleteLead(args.business, args.id);
    console.log(JSON.stringify({ success: true, message: `Lead ${args.id} deleted.` }, null, 2));
  } catch (error: any) {
    console.error('Failed to delete lead:', error.message);
    process.exit(1);
  }
}

export async function enrollLeads(args: { business: string; integration: string; campaign: string; leads: string }) {
  const config = getConfig();
  const api = new ApiClient(config);

  if (!args.integration) {
    console.error('--integration (Overloop integration ID) is required.');
    process.exit(1);
  }
  if (!args.campaign) {
    console.error('--campaign (Overloop campaign ID) is required.');
    process.exit(1);
  }
  if (!args.leads) {
    console.error('--leads (comma-separated lead IDs) is required.');
    process.exit(1);
  }

  const leadIds = args.leads.split(',').map((id) => parseInt(id.trim(), 10)).filter((id) => !isNaN(id));
  if (leadIds.length === 0) {
    console.error('No valid lead IDs provided.');
    process.exit(1);
  }

  try {
    const result = await api.enrollLeads(args.business, {
      integration_id: parseInt(args.integration, 10),
      campaign_id: args.campaign,
      lead_ids: leadIds,
    });
    console.log(JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error('Failed to enroll leads:', error.message);
    process.exit(1);
  }
}
