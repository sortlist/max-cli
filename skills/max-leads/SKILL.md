---
name: leads
description: Discover and manage leads from intent signals — list discovered leads, enroll them into Overloop campaigns, and set up webhooks for real-time notifications. Use when the user wants to harvest leads, push them to outbound campaigns, or automate lead delivery.
---

# Max Leads

You have access to the `max` CLI to manage leads discovered by intent signal monitoring.

## Prerequisites

The CLI must be installed (`npm install -g sortlist-max-cli`) and authenticated (`max login` or `MAX_API_KEY` env var).

## Lead Commands

### List Discovered Leads
```bash
max leads:list --business <business_id> [--page N] [--per-page N]
```
Returns leads sorted newest first. Each lead includes contact details, company info, and the signal that triggered discovery.

### Enroll Leads into Overloop Campaign
```bash
max leads:enroll --business <business_id> \
  --integration-id <overloop_integration_id> \
  --campaign-id <overloop_campaign_id> \
  --lead-ids "[1,2,3,4,5]"
```

Parameters:
- `--integration-id`: your Overloop integration ID (links Max to Overloop account)
- `--campaign-id`: which Overloop campaign to enroll leads into
- `--lead-ids`: JSON array of lead IDs to enroll

Response includes `enqueued` and `skipped` counts.

## Webhook Commands

Get real-time notifications when new leads are discovered.

### List Webhooks
```bash
max webhooks:list --business <business_id>
```

### Create Webhook
```bash
max webhooks:create --business <business_id> \
  --url https://your-app.com/webhook \
  [--secret "signing_secret"]
```
- URL must be HTTPS
- Optional secret for payload signing

## Lead Harvesting Workflow

1. **Check available leads**: `max leads:list --business <id> --per-page 100`
2. **Review lead quality**: Pipe through `jq` to filter by relevance
3. **Enroll best leads into Overloop**: `max leads:enroll --business <id> --integration-id <int_id> --campaign-id <camp_id> --lead-ids "[...]"`
4. **Set up webhook for automation**: `max webhooks:create --business <id> --url https://...`

## Connecting Max to Overloop

The Max-to-Overloop pipeline:

1. **Max monitors** buying intent (LinkedIn engagement, job changes, funding, etc.)
2. **Leads are discovered** matching your ICP
3. **Enroll leads** into an Overloop campaign (manual or auto-deliver)
4. **Overloop runs** the outbound email sequence

For auto-delivery, set `--auto-deliver` when creating a subscription (see the `monitor` skill).
For manual batches, use `leads:enroll` to push specific leads.

## Guidelines

- Review leads before bulk enrolling — check signal quality and ICP match.
- Use webhooks for real-time processing instead of polling `leads:list`.
- The `enqueued` count in enrollment response tells you how many were actually new.
- `skipped` leads are already in the campaign or on the exclusion list.
- All output is JSON — use `jq` to extract and filter.
