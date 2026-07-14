// Single source of truth for the product + mascot name in the CLI, so a future
// rebrand is a config change (BRAND_NAME / MASCOT_NAME env vars) rather than a
// code sweep.

export const BRAND_NAME = process.env.BRAND_NAME || 'Max';
export const MASCOT_NAME = process.env.MASCOT_NAME || BRAND_NAME;
