# Max CLI

[![npm](https://img.shields.io/npm/v/sortlist-max-cli)](https://www.npmjs.com/package/sortlist-max-cli) [![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen.svg)](LICENSE)

**Lead intelligence CLI for developers and AI agents** -- Discover leads, manage subscriptions, and automate workflows from the terminal.

The Max CLI provides a command-line interface to the [Max](https://yourmax.ai/) API, enabling developers and AI agents to monitor sources (LinkedIn, funding databases, etc.) and discover new leads programmatically.

---

## Installation

```bash
npm install -g sortlist-max-cli
```

### For AI Agents

Install the Max skill for your AI agent (Cursor, Claude Code, OpenClaw, etc.):

```bash
npx skills add sortlist/max-cli
```

This installs the [SKILL.md](SKILL.md) which gives your agent full knowledge of the CLI commands, patterns, and workflows.

---

## Authentication

The recommended way to authenticate is the interactive login command:

```bash
max login
```

This prompts for your API key (get it from **Settings > API Keys** in your dashboard), validates it, and saves it to `~/.max/config.json`.

Alternatively, set the `MAX_API_KEY` environment variable (takes priority over saved config):

```bash
export MAX_API_KEY=your_api_key
```

To remove saved credentials:

```bash
max logout
```

API keys are scoped to your **team**. Use `--business` (`-b`) to specify which business to operate on for leads, subscriptions, and webhooks.

---

## Commands

### Signals (catalog)

The signal catalog lists all available monitoring types. This is read-only and public.

```bash
# List all signal types
max signals:list

# Get details for a specific signal
max signals:get linkedin-company-engagers
```

### Businesses

Each team can have multiple businesses. All leads, subscriptions, and webhooks are scoped to a business.

```bash
# List all businesses in your team
max businesses:list

# Get a business with its Ideal Customer Profile
max businesses:get 1

# Create a business from a website (auto-analyzes name, description, and ICP)
max businesses:create --website https://acme.com

# Create a business manually
max businesses:create --name "Acme Corp" --website https://acme.com

# Create with ICP attributes
max businesses:create --name "Acme Corp" \
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
max businesses:update 1 --name "New Name"

# Update the ICP (include the ICP id from businesses:get response)
max businesses:update 1 --icp '{"id":1,"target_job_titles":["CTO","VP Engineering"]}'
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
max subscriptions:list --business 1

# Get a subscription with stats
max subscriptions:get 42 --business 1

# Create a subscription
max subscriptions:create --business 1 \
  --signal linkedin-company-engagers \
  --name "Apple Engagers" \
  --config '{"linkedin_url":"https://www.linkedin.com/company/apple/"}'

# Update a subscription
max subscriptions:update 42 --business 1 --name "Renamed Subscription"

# Pause (stops scanning for new leads)
max subscriptions:pause 42 --business 1

# Resume
max subscriptions:resume 42 --business 1

# Delete
max subscriptions:delete 42 --business 1
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
max leads:list --business 1
max leads:list --business 1 --page 2 --per-page 50

# Get a single lead with full details and delivery history
max leads:get 1234 --business 1

# Delete a lead (soft-delete)
max leads:delete 1234 --business 1
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
max webhooks:list --business 1

# Create a webhook with HMAC signature verification
max webhooks:create --business 1 --url https://example.com/webhook --secret whsec_abc123

# Delete a webhook
max webhooks:delete 10 --business 1
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
max leads:list --business 1 --per-page 100 | jq '.leads[] | .payload.email'

# Get subscription IDs that are active
max subscriptions:list --business 1 | jq '.subscriptions[] | select(.active) | .id'

# Count total leads
max leads:list --business 1 | jq '.meta.total_count'

# List business names
max businesses:list | jq '.businesses[] | .name'
```

---

## Common Workflows

### Set up a new business and start monitoring

```bash
# 1. Create a business from a website (auto-generates ICP)
max businesses:create --website https://acme.com

# 2. Note the business ID from the response, then browse signals
max signals:list

# 3. Create a subscription
max subscriptions:create --business 1 \
  --signal linkedin-company-engagers \
  --name "Acme Engagers" \
  --config '{"linkedin_url":"https://www.linkedin.com/company/acme/"}'

# 4. Check for leads
max leads:list --business 1
```

### Pause and resume scanning

```bash
max subscriptions:pause 42 --business 1    # Stop scanning
max subscriptions:resume 42 --business 1   # Start scanning again
```

### Set up real-time notifications

```bash
# Register a webhook
max webhooks:create --business 1 --url https://my-app.com/signals --secret my_secret

# Verify
max webhooks:list --business 1
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MAX_API_KEY` | No | Your Max API key (overrides saved config from `max login`) |

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
git clone https://github.com/sortlist/max-cli.git
cd max-cli
npm install
npm run dev    # Watch mode
npm run build  # Production build
```

### Project Structure

```
src/
  index.ts              # CLI entry point (yargs)
  api.ts                # ApiClient client class
  config.ts             # Config management (~/.max/config.json)
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

Full API docs: [https://api.yourmax.ai/docs/api](https://api.yourmax.ai/docs/api)

---

## License

MIT

---

## Links

- **Website:** [api.yourmax.ai](https://api.yourmax.ai)
- **API Docs:** [api.yourmax.ai/docs/api](https://api.yourmax.ai/docs/api)
- **GitHub:** [sortlist/max-cli](https://github.com/sortlist/max-cli)
- **Issues:** [Report bugs](https://github.com/sortlist/max-cli/issues)
