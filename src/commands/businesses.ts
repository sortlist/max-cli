import { ApiClient } from '../api';
import { getConfig } from '../config';

export async function listBusinesses() {
  const config = getConfig();
  const api = new ApiClient(config);

  try {
    const result = await api.listBusinesses();
    console.log(JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error('Failed to list businesses:', error.message);
    process.exit(1);
  }
}

export async function getBusiness(args: { id: string }) {
  const config = getConfig();
  const api = new ApiClient(config);

  if (!args.id) {
    console.error('Business ID is required.');
    process.exit(1);
  }

  try {
    const result = await api.getBusiness(args.id);
    console.log(JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error('Failed to get business:', error.message);
    process.exit(1);
  }
}

export async function updateBusiness(args: { id: string; name?: string; website?: string; description?: string; icp?: string }) {
  const config = getConfig();
  const api = new ApiClient(config);

  if (!args.id) {
    console.error('Business ID is required.');
    process.exit(1);
  }

  const data: any = {};
  if (args.name) data.name = args.name;
  if (args.website) data.website = args.website;
  if (args.description) data.description = args.description;

  if (args.icp) {
    try {
      data.ideal_customer_profile_attributes = JSON.parse(args.icp);
    } catch {
      console.error('Failed to parse --icp JSON:', args.icp);
      process.exit(1);
    }
  }

  if (Object.keys(data).length === 0) {
    console.error('At least one field to update is required (--name, --website, --description, or --icp).');
    process.exit(1);
  }

  try {
    const result = await api.updateBusiness(args.id, data);
    console.log(JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error('Failed to update business:', error.message);
    process.exit(1);
  }
}

export async function createBusiness(args: { name?: string; website?: string; description?: string; icp?: string }) {
  const config = getConfig();
  const api = new ApiClient(config);

  if (!args.name && !args.website) {
    console.error('Either --name or --website is required.');
    process.exit(1);
  }

  let icpAttributes: Record<string, any> | undefined;
  if (args.icp) {
    try {
      icpAttributes = JSON.parse(args.icp);
    } catch {
      console.error('Failed to parse --icp JSON:', args.icp);
      process.exit(1);
    }
  }

  try {
    const data: any = {};
    if (args.name) data.name = args.name;
    if (args.website) data.website = args.website;
    if (args.description) data.description = args.description;
    if (icpAttributes) data.ideal_customer_profile_attributes = icpAttributes;

    const result = await api.createBusiness(data);
    console.log(JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error('Failed to create business:', error.message);
    process.exit(1);
  }
}
