---
name: signals-cli
description: Signals CLI skill — Monitor sources (LinkedIn, funding databases, etc.) and discover new leads programmatically
---

# Signals CLI Skill

Signals is a lead intelligence platform that monitors sources (LinkedIn, funding databases, etc.) and discovers new leads for sales teams. This CLI lets you manage businesses, signals, subscriptions, leads, and webhooks from the terminal.

## Setup

```bash
npm install -g signals-sortlist-cli
signals login
```

`signals login` connects via your browser using the OAuth 2.0 device
authorization flow (RFC 8628): it prints an `XXXX-XXXX` verification code, opens
the Signals device page, and once you click **Connect** the CLI is authenticated
automatically. Tokens are saved to `~/.signals/config.json` (mode 0600) and
refreshed automatically. Run `signals logout` to disconnect.

For CI or other non-interactive environments, skip `signals login` and set an API
key instead (from Settings > API Keys), which always takes precedence:

```bash
export SIGNALS_API_KEY=your_api_key
```

## Concepts

- **Team**: Your organization. API keys are scoped to a team.
- **Business**: A company you're prospecting for. Each team can have multiple businesses. Leads, subscriptions, and webhooks are scoped to a business.
- **Signal**: A type of monitoring (e.g. "LinkedIn Company Engagers", "Recently Funded Companies"). Read-only catalog.
- **Subscription**: An active signal you've configured (e.g. "Track engagers on Apple's LinkedIn page"). You create, pause, resume, and delete these.
- **Lead**: An enriched profile discovered by a subscription. Contains name, email, company, LinkedIn URL, and more.
- **Webhook**: A URL that receives an HTTP POST whenever a new lead is discovered.
- **Integration**: A connected external tool (e.g. Overloop, Instantly, Slack, Webhook) that can receive leads. Integrations are configured at the business level, then linked to individual subscriptions for automatic or manual delivery.
- **Campaign-based integration**: Integrations like Overloop and Instantly that organize outreach into campaigns. They expose campaigns via `integrations:campaigns` and support enrolling leads into a specific campaign.
- **Subscription Integration**: The link between a subscription and an integration, with settings like `auto_deliver` and a `campaign_id` (for campaign-based integrations).

## All Commands

All output is JSON. Pipe to `jq` for filtering. Commands that operate on leads, subscriptions, or webhooks require `--business` (`-b`) to specify the business ID.

### Businesses

```bash
# List all businesses in the team
signals businesses:list

# Get a business with its Ideal Customer Profile
signals businesses:get <id>
signals businesses:get 1

# Create a business from a website (auto-analyzes name, description, ICP)
signals businesses:create --website <url>
signals businesses:create --website https://acme.com

# Create a business manually
signals businesses:create --name <name> [--website <url>] [--description <text>] [--icp '<json>']
signals businesses:create --name "Acme Corp" --website https://acme.com

# Update a business or its ICP
signals businesses:update <id> [--name <name>] [--website <url>] [--description <text>] [--icp '<json>']
signals businesses:update 1 --icp '{"id":1,"target_job_titles":["CTO"],"lead_matching_mode":70}'
```

### Signals (read-only catalog)

```bash
# List all available signal types
signals signals:list

# Get details for a signal type
signals signals:get <slug>
signals signals:get linkedin-company-engagers
```

### Subscriptions (your active signals)

```bash
# List all subscriptions for a business
signals subscriptions:list --business <id>
signals subscriptions:list --business 1

# Get a subscription with stats
signals subscriptions:get <id> --business <business_id>
signals subscriptions:get 42 --business 1

# Create a subscription
signals subscriptions:create --business <id> --signal <slug> --name <name> [--config '<json>'] [--daily-lead-limit <n>] [--integrations '<json>']
signals subscriptions:create --business 1 --signal linkedin-company-engagers --name "Apple Engagers" --config '{"linkedin_url":"https://www.linkedin.com/company/apple/"}'

# Create a subscription with a custom daily lead limit
signals subscriptions:create --business 1 --signal linkedin-company-engagers --name "Apple Engagers" --daily-lead-limit 50 \
  --config '{"linkedin_url":"https://www.linkedin.com/company/apple/"}'

# Create a subscription with a campaign integration linked (Overloop or Instantly)
signals subscriptions:create --business 1 --signal linkedin-company-engagers --name "Apple Engagers" \
  --config '{"linkedin_url":"https://www.linkedin.com/company/apple/"}' \
  --integrations '[{"integration_id":5,"auto_deliver":true,"campaign_id":"abc123","campaign_name":"Q1 Outreach"}]'

# Update a subscription
signals subscriptions:update <id> --business <business_id> [--name <name>] [--active <bool>] [--config '<json>'] [--daily-lead-limit <n>] [--integrations '<json>']
signals subscriptions:update 42 --business 1 --name "New Name"

# Change the daily lead limit
signals subscriptions:update 42 --business 1 --daily-lead-limit 200

# Link or update integrations on an existing subscription
signals subscriptions:update 42 --business 1 \
  --integrations '[{"integration_id":5,"auto_deliver":true,"campaign_id":"abc123","campaign_name":"Q1 Outreach"}]'

# Pause a subscription (stops scanning for new leads)
signals subscriptions:pause <id> --business <business_id>
signals subscriptions:pause 42 --business 1

# Resume a paused subscription
signals subscriptions:resume <id> --business <business_id>
signals subscriptions:resume 42 --business 1

# Delete a subscription
signals subscriptions:delete <id> --business <business_id>
signals subscriptions:delete 42 --business 1
```

### Integrations (connected tools like Overloop and Instantly)

```bash
# List all integrations for a business
signals integrations:list --business <id>
signals integrations:list --business 1

# List campaigns available in a campaign-based integration (Overloop or Instantly)
signals integrations:campaigns <integration_id> --business <business_id>
signals integrations:campaigns 5 --business 1
```

The `--integrations` option on `subscriptions:create` and `subscriptions:update` accepts a JSON array. Each entry has:
- `integration_id` (required): The integration to link.
- `auto_deliver` (optional, default false): If true, new leads are automatically sent to this integration.
- `campaign_id` (optional): The campaign ID to enroll leads into (for campaign-based integrations like Overloop and Instantly). Legacy alias: `overloop_campaign_id`.
- `campaign_name` (optional): Display name for the campaign. Legacy alias: `overloop_campaign_name`.

Passing `--integrations` replaces all current integration links on the subscription. Omit an integration from the array to unlink it.

### Leads (discovered profiles)

Each lead includes: `id`, `external_id`, `name`, `headline`, `job_title`, `email`, `phone`, `linkedin_url`, `profile_picture`, `location`, `company`, `company_logo`, `company_industry`, `company_size`, `company_website`, `company_linkedin`, `company_founded`, `connections`, `followers`, `icp_score`, `engagement_type`, `post_url`, `signals`, `subscription_ids`, `payload`, `triggered_at`, `created_at`. Fields are `null` when not available.

```bash
# List leads (paginated)
signals leads:list --business <id> [--page <n>] [--per-page <n>]
signals leads:list --business 1 --page 2 --per-page 50

# Get a single lead with delivery history
signals leads:get <id> --business <business_id>
signals leads:get 1234 --business 1

# Delete a lead (soft-delete)
signals leads:delete <id> --business <business_id>
signals leads:delete 1234 --business 1

# Enroll leads into a campaign (Overloop or Instantly)
signals leads:enroll --business <id> --integration <integration_id> --campaign <campaign_id> --leads <comma_separated_ids>
signals leads:enroll --business 1 --integration 5 --campaign abc123 --leads 100,101,102
```

### Webhooks

```bash
# List registered webhooks for a business
signals webhooks:list --business <id>
signals webhooks:list --business 1

# Create a webhook (with optional HMAC signing secret)
signals webhooks:create --business <id> --url <url> [--secret <secret>]
signals webhooks:create --business 1 --url https://example.com/webhook --secret my_secret

# Delete a webhook
signals webhooks:delete <id> --business <business_id>
signals webhooks:delete 10 --business 1
```

## Common Workflows

### Set up a new business and start monitoring

```bash
# 1. Create a business from a website (auto-generates ICP)
signals businesses:create --website https://acme.com

# 2. Note the business ID from the response, then browse signals
signals signals:list

# 3. Get details on a signal
signals signals:get linkedin-company-engagers

# 4. Create a subscription
signals subscriptions:create --business 1 \
  --signal linkedin-company-engagers \
  --name "Acme Engagers" \
  --config '{"linkedin_url":"https://www.linkedin.com/company/acme/"}'
```

### Check leads and export

```bash
# List recent leads
signals leads:list --business 1 --per-page 100

# Get full details for a specific lead (includes email, phone, deliveries)
signals leads:get 1234 --business 1

# Get all leads as JSON for processing
signals leads:list --business 1 --per-page 100 | jq '.leads[] | {name, email: .payload.email, company}'
```

### Set up a webhook for real-time notifications

```bash
# Register a webhook
signals webhooks:create --business 1 --url https://my-app.com/signals-webhook --secret whsec_abc123

# Verify it was created
signals webhooks:list --business 1

# Remove it later
signals webhooks:delete 10 --business 1
```

### Connect a campaign integration (Overloop or Instantly) to a subscription

```bash
# 1. List integrations to find the campaign integration ID
signals integrations:list --business 1

# 2. List available campaigns for that integration
signals integrations:campaigns 5 --business 1

# 3. Link the integration to a subscription with auto-delivery
signals subscriptions:update 42 --business 1 \
  --integrations '[{"integration_id":5,"auto_deliver":true,"campaign_id":"abc123","campaign_name":"Q1 Outreach"}]'
```

### Manually enroll leads into a campaign (Overloop or Instantly)

```bash
# 1. Find leads to enroll
signals leads:list --business 1 --per-page 50

# 2. Enroll specific leads by ID
signals leads:enroll --business 1 --integration 5 --campaign abc123 --leads 100,101,102
# Returns: {"enqueued": 3, "skipped": 0}
# Leads without an email or LinkedIn URL are skipped.
```

### Pause and resume a subscription

```bash
# Pause (stops scanning)
signals subscriptions:pause 42 --business 1

# Resume (starts scanning again)
signals subscriptions:resume 42 --business 1
```

## Error Handling

- **Exit code 0**: Success. Output is JSON on stdout.
- **Exit code 1**: Error. Message is printed to stderr.
- **401**: Not authenticated (run `signals login`) or an invalid/expired credential. OAuth sessions are refreshed automatically; if refresh fails, log in again.
- **404**: Resource not found.
- **422**: Validation error (e.g. missing required fields).
- **429**: Rate limited (60 requests/minute per key).

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SIGNALS_API_KEY` | No | Your Signals API key. Takes precedence over the OAuth session saved by `signals login`. |
| `SIGNALS_API_URL` | No | Override the API base URL (default `https://api.meetsignals.ai`). |
| `SIGNALS_OAUTH_URL` | No | Override the OAuth/authorization server URL used by `signals login` (default `https://meetsignals.ai`). |
| `SIGNALS_CLI_CLIENT_ID` | No | Override the public OAuth client_id (default `signals-cli`). |
