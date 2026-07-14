---
name: monitor
description: Set up and manage intent signal monitoring — create businesses with ICP, subscribe to signal types, and manage subscriptions. Use when the user wants to monitor buying signals, set up intent tracking, or manage their signal subscriptions.
---

# Max Monitor

You have access to the `max` CLI to monitor buying intent signals and discover leads.

## Prerequisites

The CLI must be installed (`npm install -g sortlist-max-cli`) and authenticated (`max login` or `MAX_API_KEY` env var).

## Signal Types

List all available signal types:
```bash
max signals:list
```

Get details on a specific signal:
```bash
max signals:get <slug>
```
Example slugs: `linkedin-post-engagement`, `job-changes`, `funding-rounds`

## Business Commands

Each business represents a company you want to monitor signals for, with its own ICP.

### List Businesses
```bash
max businesses:list
```

### Get Business (with ICP)
```bash
max businesses:get <id>
```
Returns business details with full `ideal_customer_profile`.

### Create Business

**Auto-analysis mode** (recommended) — send only website, Max analyzes and builds ICP:
```bash
max businesses:create --website https://acme.com
```

**Manual mode** — specify ICP yourself:
```bash
max businesses:create --name "Acme Corp" --data '{
  "ideal_customer_profile_attributes": {
    "target_job_titles": ["VP Sales", "Head of Growth"],
    "target_locations": ["Belgium", "France"],
    "target_industries": ["SaaS", "Technology"],
    "company_types": ["SMB", "Mid-Market"],
    "company_sizes": ["11-50", "51-200"],
    "mandatory_keywords": ["B2B"],
    "excluded_companies": ["Competitor Inc"]
  }
}'
```

### Update Business / ICP
```bash
max businesses:update <id> --data '{
  "name": "Updated Name",
  "ideal_customer_profile_attributes": {
    "id": <icp_id>,
    "target_locations": ["Germany", "Netherlands"]
  }
}'
```
You need the ICP `id` from `businesses:get` to update ICP fields.

## Subscription Commands

Subscriptions are active monitoring configs — they watch a signal type for a business.

### List Subscriptions
```bash
max subscriptions:list --business <business_id> [--page N] [--per-page N]
```

### Create Subscription
```bash
max subscriptions:create --business <business_id> \
  --signal-slug linkedin-post-engagement \
  --name "LinkedIn Engagement Tracker" \
  [--auto-deliver] \
  [--integration-id <overloop_integration_id>] \
  [--overloop-campaign-id <campaign_id>]
```

Key parameters:
- `--signal-slug`: which signal to monitor (from `signals:list`)
- `--auto-deliver`: auto-send leads to Overloop
- `--integration-id` + `--overloop-campaign-id`: link to Overloop campaign

### Pause / Resume Subscription
```bash
max subscriptions:pause --business <business_id> --subscription <id>
max subscriptions:resume --business <business_id> --subscription <id>
```

## Typical Setup Flow

1. **List available signals**: `max signals:list`
2. **Create business with ICP**: `max businesses:create --website https://target.com`
3. **Review auto-generated ICP**: `max businesses:get <id>`
4. **Refine ICP if needed**: `max businesses:update <id> --data '{...}'`
5. **Subscribe to signals**: `max subscriptions:create --business <id> --signal-slug <slug> --name "My Monitor"`
6. **Optionally link to Overloop**: Add `--auto-deliver --integration-id <id> --overloop-campaign-id <campaign_id>`

## Guidelines

- Start with auto-analysis (`--website` only) and refine ICP after reviewing.
- The ICP is used to score lead fit (ICP Fit), not to reject or filter leads.
- Link subscriptions to Overloop campaigns for automatic lead delivery.
- All output is JSON — use `jq` to extract fields.
