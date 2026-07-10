<div align="center">

# Signals CLI

**Know who's buying before they tell you.**

Monitor LinkedIn engagers, keyword posters, job changers, and funding events. Get leads delivered to your terminal.

[![npm](https://img.shields.io/npm/v/signals-sortlist-cli)](https://www.npmjs.com/package/signals-sortlist-cli)
[![npm downloads](https://img.shields.io/npm/dw/signals-sortlist-cli)](https://www.npmjs.com/package/signals-sortlist-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen.svg)](LICENSE)

</div>

---

## Quick Start

```bash
npm install -g signals-sortlist-cli
signals login
signals businesses:create --website https://acme.com
signals subscriptions:create --business 1 --signal linkedin-company-engagers --name "Acme watchers" --config '{"linkedin_url":"https://linkedin.com/company/acme/"}'
signals leads:list --business 1
```

Set up monitoring in 4 commands. Leads start flowing.

## Why Signals CLI

- **Intent signals** -- know who's engaging with competitors, posting about your keywords, changing jobs, getting funded
- **CLI-first** -- built for terminals and AI agents, not dashboards
- **Auto-enriched leads** -- name, company, email, phone, LinkedIn URL
- **JSON output** -- every command returns JSON, pipe to `jq` or feed to your agent
- **Webhooks** -- get real-time notifications when new leads drop

## Signal Types

| Signal | What it detects |
|--------|----------------|
| `linkedin-company-engagers` | People engaging with a company's LinkedIn posts |
| `linkedin-keyword-posters` | People posting about specific keywords |
| `linkedin-job-changers` | People who recently changed roles |
| `recently-funded` | Companies that just raised funding |

## Works With

Use as a standalone CLI or as a skill for your AI agent:

```bash
npx skills add sortlist/signals-cli
```

Compatible with **Claude Code**, **Cursor**, **Gemini CLI**, **OpenCode**, **Codex**, and any agent that supports the Skills spec.

## Signals + Overloop = Full Pipeline

Pair with [Overloop CLI](https://github.com/sortlist/overloop-cli) for intent-driven outbound:

```bash
# 1. Detect who's engaging with your competitor
signals leads:list --business 1 | jq '.leads[] | .payload'

# 2. Add to Overloop as prospects
overloop prospects:create --email lead@company.com --first-name Jane

# 3. Enroll in a campaign
overloop enrollments:create --campaign 1 --prospect <id>
```

Intent detected. Outreach launched. Pipeline built. Three CLI calls.

---

## Authentication

The recommended way to authenticate is the interactive login command:

```bash
signals login
```

This prompts for your API key (get it from **Settings > API Keys** in your dashboard), validates it, and saves it to `~/.signals/config.json`.

Alternatively, set the `SIGNALS_API_KEY` environment variable (takes priority over saved config):

```bash
export SIGNALS_API_KEY=your_api_key
```

To remove saved credentials:

```bash
signals logout
```

API keys are scoped to your **team**. Use `--business` (`-b`) to specify which business to operate on for leads, subscriptions, and webhooks.

---

## Commands

### Signals (catalog)

The signal catalog lists all available monitoring types. This is read-only and public.

```bash
# List all signal types
signals signals:list

# Get details for a specific signal
signals signals:get linkedin-company-engagers
```

### Businesses

Each team can have multiple businesses. All leads, subscriptions, and webhooks are scoped to a business.

```bash
# List all businesses in your team
signals businesses:list

# Get a business with its Ideal Customer Profile
signals businesses:get 1

# Create a business from a website (auto-analyzes name, description, and ICP)
signals businesses:create --website https://acme.com

# Create a business manually
signals businesses:create --name "Acme Corp" --website https://acme.com

# Create with ICP attributes
signals businesses:create --name "Acme Corp" \
  --icp '{"target_job_titles":["CTO","VP of Engineering"],"target_locations":["North America"]}'
```

**`businesses:create` options:**

| Option | Required | Description |
|---|---|---|
| `--website` | Conditional | Website URL. If passed alone, auto-analyzes name/description/ICP |
| `--name` | Conditional | Business name (required when not using website-only mode) |
| `--description` | No | Short description |
| `--icp` | No | Ideal Customer Profile attributes as JSON string |

```bash
# Update a business name
signals businesses:update 1 --name "New Name"

# Update the ICP (include the ICP id from businesses:get response)
signals businesses:update 1 --icp '{"id":1,"target_job_titles":["CTO","VP Engineering"],"lead_matching_mode":70}'
```

**`businesses:update` options:**

| Option | Description |
|---|---|
| `--name` | Business name |
| `--website` | Website URL |
| `--description` | Short description |
| `--icp` | ICP attributes as JSON string (include `id` to update existing ICP) |

### Subscriptions

A subscription is a signal you've activated with a specific configuration (e.g. "Track engagers on Apple's LinkedIn page"). All subscription commands require `--business` (`-b`).

```bash
# List all subscriptions
signals subscriptions:list --business 1

# Get a subscription with stats
signals subscriptions:get 42 --business 1

# Create a subscription
signals subscriptions:create --business 1 \
  --signal linkedin-company-engagers \
  --name "Apple Engagers" \
  --config '{"linkedin_url":"https://www.linkedin.com/company/apple/"}'

# Update a subscription
signals subscriptions:update 42 --business 1 --name "Renamed Subscription"

# Pause (stops scanning for new leads)
signals subscriptions:pause 42 --business 1

# Resume
signals subscriptions:resume 42 --business 1

# Delete
signals subscriptions:delete 42 --business 1
```

**`subscriptions:create` options:**

| Option | Required | Description |
|---|---|---|
| `--business` | Yes | Business ID |
| `--signal` | Yes | Signal slug from the catalog |
| `--name` | Yes | Name for this subscription |
| `--config` | No | Signal-specific config as JSON string |

**`subscriptions:update` options:**

| Option | Description |
|---|---|
| `--name` | Updated name |
| `--active` | Set active state (true/false) |
| `--config` | Updated config as JSON string |

### Leads

Leads are enriched profiles discovered by your active subscriptions. Each lead includes name, company, LinkedIn URL, email, phone, and more. All lead commands require `--business` (`-b`).

```bash
# List leads (paginated)
signals leads:list --business 1
signals leads:list --business 1 --page 2 --per-page 50

# Get a single lead with full details and delivery history
signals leads:get 1234 --business 1

# Delete a lead (soft-delete)
signals leads:delete 1234 --business 1
```

**`leads:list` options:**

| Option | Default | Description |
|---|---|---|
| `--business` | — | Business ID (required) |
| `--page` | 1 | Page number |
| `--per-page` | 25 | Results per page (max 100) |

### Webhooks

Register URLs to receive an HTTP POST in real-time whenever a new lead is discovered. All webhook commands require `--business` (`-b`).

```bash
# List webhooks
signals webhooks:list --business 1

# Create a webhook with HMAC signature verification
signals webhooks:create --business 1 --url https://example.com/webhook --secret whsec_abc123

# Delete a webhook
signals webhooks:delete 10 --business 1
```

**`webhooks:create` options:**

| Option | Required | Description |
|---|---|---|
| `--business` | Yes | Business ID |
| `--url` | Yes | URL to receive POST requests |
| `--secret` | No | Secret for HMAC-SHA256 signature verification |

---

## All Output is JSON

Every command outputs JSON for easy parsing with `jq` or consumption by AI agents:

```bash
# Get all lead emails
signals leads:list --business 1 --per-page 100 | jq '.leads[] | .payload.email'

# Get subscription IDs that are active
signals subscriptions:list --business 1 | jq '.subscriptions[] | select(.active) | .id'

# Count total leads
signals leads:list --business 1 | jq '.meta.total_count'

# List business names
signals businesses:list | jq '.businesses[] | .name'
```

---

## Common Workflows

### Set up a new business and start monitoring

```bash
# 1. Create a business from a website (auto-generates ICP)
signals businesses:create --website https://acme.com

# 2. Note the business ID from the response, then browse signals
signals signals:list

# 3. Create a subscription
signals subscriptions:create --business 1 \
  --signal linkedin-company-engagers \
  --name "Acme Engagers" \
  --config '{"linkedin_url":"https://www.linkedin.com/company/acme/"}'

# 4. Check for leads
signals leads:list --business 1
```

### Pause and resume scanning

```bash
signals subscriptions:pause 42 --business 1    # Stop scanning
signals subscriptions:resume 42 --business 1   # Start scanning again
```

### Set up real-time notifications

```bash
# Register a webhook
signals webhooks:create --business 1 --url https://my-app.com/signals --secret my_secret

# Verify
signals webhooks:list --business 1
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SIGNALS_API_KEY` | No | Your Signals API key (overrides saved config from `signals login`) |

---

## Error Handling

| Exit Code | Meaning |
|---|---|
| 0 | Success |
| 1 | Error (message on stderr) |

| HTTP Status | Meaning |
|---|---|
| 401 | Missing or invalid API key |
| 404 | Resource not found |
| 422 | Validation error |
| 429 | Rate limited (60 req/min) |

---

## Development

```bash
git clone https://github.com/sortlist/signals-cli.git
cd signals-cli
npm install
npm run dev    # Watch mode
npm run build  # Production build
```

### Project Structure

```
src/
  index.ts              # CLI entry point (yargs)
  api.ts                # SignalsAPI client class
  config.ts             # Config management (~/.signals/config.json)
  commands/
    login.ts            # login, logout
    signals.ts          # signals:list, signals:get
    businesses.ts       # businesses:list, businesses:get, businesses:create, businesses:update
    subscriptions.ts    # Subscription management
    leads.ts            # Lead management
    webhooks.ts         # Webhook management
```

---

## API Documentation

Full API docs: [https://api.meetsignals.ai/docs/api](https://api.meetsignals.ai/docs/api)

---

## License

MIT

---

## Links

- **Website:** [api.meetsignals.ai](https://api.meetsignals.ai)
- **API Docs:** [api.meetsignals.ai/docs/api](https://api.meetsignals.ai/docs/api)
- **GitHub:** [sortlist/signals-cli](https://github.com/sortlist/signals-cli)
- **Issues:** [Report bugs](https://github.com/sortlist/signals-cli/issues)
