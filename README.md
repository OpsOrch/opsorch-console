# OpsOrch Console

OpsOrch Console is the operator-focused web UI for OpsOrch. It provides a unified interface for browsing and managing incidents, logs, metrics, services, tickets, and AI-powered chat assistance through OpsOrch Copilot.

## Features

- **Incidents**: Browse, search, and view incident details with timelines
- **Logs**: Query and analyze logs across integrated providers
- **Metrics**: Visualize and query metrics data
- **Services**: Explore service catalog and dependencies
- **Tickets**: View and manage tickets from integrated ticketing systems
- **Chat**: AI-powered assistance via OpsOrch Copilot for incident investigation, log analysis, and operational queries
- **Settings**: Configure OpsOrch Core and Copilot endpoints

## Architecture

The Console is a Next.js application that communicates with:
- **OpsOrch Core** (via HTTP) for operational data (incidents, logs, metrics, services, tickets)
- **OpsOrch Copilot** (via HTTP) for AI-powered chat assistance

```
OpsOrch Console (Next.js UI)
    ↓
    ├─→ OpsOrch Core (operational data)
    └─→ OpsOrch Copilot (AI chat)
```

## Getting Started

### Prerequisites
- Node.js 20+ installed
- OpsOrch Core running (default: `http://localhost:8080`)
- OpsOrch Copilot running (optional, default: `http://localhost:6060`)

### Installation

```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the console.

### Environment Configuration

The console can be configured via environment variables or through the Settings page in the UI.

**Environment Variables:**
- `NEXT_PUBLIC_OPSORCH_CORE_URL` - OpsOrch Core URL (default: `http://localhost:8080`)
- `NEXT_PUBLIC_COPILOT_URL` - OpsOrch Copilot URL (default: `http://localhost:6060`)

**Runtime Configuration:**
- Navigate to Settings (`/settings`) in the UI to configure endpoints without restarting

### Production Build

Build the production bundle:

```bash
npm run build
npm start
```

### Testing

Run the test suite:

```bash
npm test
```

## Project Structure

- `app/` - Next.js app router pages and layouts
  - `incidents/` - Incident listing and detail pages
  - `logs/` - Log query interface
  - `metrics/` - Metrics query and visualization
  - `services/` - Service catalog
  - `tickets/` - Ticket management
  - `chats/` - AI-powered chat interface
  - `settings/` - Configuration panel
- `app/components/` - Reusable React components
- `app/lib/` - Utility functions and API clients

## Learn More

- [OpsOrch Core Documentation](../opsorch-core/README.md)
- [OpsOrch Copilot Documentation](../opsorch-copilot/README.md)
- [Next.js Documentation](https://nextjs.org/docs)

