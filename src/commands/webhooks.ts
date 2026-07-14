import { ApiClient } from '../api';
import { getConfig } from '../config';

export async function listWebhooks(args: { business: string }) {
  const config = getConfig();
  const api = new ApiClient(config);

  try {
    const result = await api.listWebhooks(args.business);
    console.log(JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error('Failed to list webhooks:', error.message);
    process.exit(1);
  }
}

export async function createWebhook(args: { business: string; url: string; secret?: string }) {
  const config = getConfig();
  const api = new ApiClient(config);

  if (!args.url) {
    console.error('--url is required.');
    process.exit(1);
  }

  try {
    const result = await api.createWebhook(args.business, {
      url: args.url,
      secret: args.secret,
    });
    console.log(JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error('Failed to create webhook:', error.message);
    process.exit(1);
  }
}

export async function deleteWebhook(args: { business: string; id: string }) {
  const config = getConfig();
  const api = new ApiClient(config);

  if (!args.id) {
    console.error('Webhook ID is required.');
    process.exit(1);
  }

  try {
    await api.deleteWebhook(args.business, args.id);
    console.log(JSON.stringify({ success: true, message: `Webhook ${args.id} deleted.` }, null, 2));
  } catch (error: any) {
    console.error('Failed to delete webhook:', error.message);
    process.exit(1);
  }
}
