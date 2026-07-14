import { ApiClient } from '../api';
import { getConfig } from '../config';

export async function listSubscriptions(args: { business: string }) {
  const config = getConfig();
  const api = new ApiClient(config);

  try {
    const result = await api.listSubscriptions(args.business);
    console.log(JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error('Failed to list subscriptions:', error.message);
    process.exit(1);
  }
}

export async function getSubscription(args: { business: string; id: string }) {
  const config = getConfig();
  const api = new ApiClient(config);

  if (!args.id) {
    console.error('Subscription ID is required.');
    process.exit(1);
  }

  try {
    const result = await api.getSubscription(args.business, args.id);
    console.log(JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error('Failed to get subscription:', error.message);
    process.exit(1);
  }
}

export async function createSubscription(args: { business: string; signal: string; name: string; config?: string; integrations?: string }) {
  const config = getConfig();
  const api = new ApiClient(config);

  if (!args.signal) {
    console.error('--signal (signal slug) is required.');
    process.exit(1);
  }
  if (!args.name) {
    console.error('--name is required.');
    process.exit(1);
  }

  let parsedConfig: Record<string, any> | undefined;
  if (args.config) {
    try {
      parsedConfig = JSON.parse(args.config);
    } catch {
      console.error('Failed to parse --config JSON:', args.config);
      process.exit(1);
    }
  }

  let parsedIntegrations: Array<{ integration_id: number; auto_deliver?: boolean; campaign_id?: string; campaign_name?: string; overloop_campaign_id?: string; overloop_campaign_name?: string }> | undefined;
  if (args.integrations) {
    try {
      parsedIntegrations = JSON.parse(args.integrations);
    } catch {
      console.error('Failed to parse --integrations JSON:', args.integrations);
      process.exit(1);
    }
  }

  try {
    const result = await api.createSubscription(args.business, {
      signal_slug: args.signal,
      name: args.name,
      config: parsedConfig,
      integrations: parsedIntegrations,
    });
    console.log(JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error('Failed to create subscription:', error.message);
    process.exit(1);
  }
}

export async function updateSubscription(args: { business: string; id: string; name?: string; active?: boolean; config?: string; integrations?: string }) {
  const config = getConfig();
  const api = new ApiClient(config);

  if (!args.id) {
    console.error('Subscription ID is required.');
    process.exit(1);
  }

  const data: { name?: string; active?: boolean; config?: Record<string, any>; integrations?: Array<{ integration_id: number; auto_deliver?: boolean; campaign_id?: string; campaign_name?: string; overloop_campaign_id?: string; overloop_campaign_name?: string }> } = {};
  if (args.name !== undefined) data.name = args.name;
  if (args.active !== undefined) data.active = args.active;
  if (args.config) {
    try {
      data.config = JSON.parse(args.config);
    } catch {
      console.error('Failed to parse --config JSON:', args.config);
      process.exit(1);
    }
  }
  if (args.integrations) {
    try {
      data.integrations = JSON.parse(args.integrations);
    } catch {
      console.error('Failed to parse --integrations JSON:', args.integrations);
      process.exit(1);
    }
  }

  try {
    const result = await api.updateSubscription(args.business, args.id, data);
    console.log(JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error('Failed to update subscription:', error.message);
    process.exit(1);
  }
}

export async function pauseSubscription(args: { business: string; id: string }) {
  const config = getConfig();
  const api = new ApiClient(config);

  if (!args.id) {
    console.error('Subscription ID is required.');
    process.exit(1);
  }

  try {
    const result = await api.pauseSubscription(args.business, args.id);
    console.log(JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error('Failed to pause subscription:', error.message);
    process.exit(1);
  }
}

export async function resumeSubscription(args: { business: string; id: string }) {
  const config = getConfig();
  const api = new ApiClient(config);

  if (!args.id) {
    console.error('Subscription ID is required.');
    process.exit(1);
  }

  try {
    const result = await api.resumeSubscription(args.business, args.id);
    console.log(JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error('Failed to resume subscription:', error.message);
    process.exit(1);
  }
}

export async function deleteSubscription(args: { business: string; id: string }) {
  const config = getConfig();
  const api = new ApiClient(config);

  if (!args.id) {
    console.error('Subscription ID is required.');
    process.exit(1);
  }

  try {
    await api.deleteSubscription(args.business, args.id);
    console.log(JSON.stringify({ success: true, message: `Subscription ${args.id} deleted.` }, null, 2));
  } catch (error: any) {
    console.error('Failed to delete subscription:', error.message);
    process.exit(1);
  }
}
