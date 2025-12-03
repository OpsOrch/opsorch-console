# OpsOrch Console

OpsOrch Console is the operator-focused web UI for OpsOrch. It provides a unified interface for browsing and managing incidents, logs, metrics, services, tickets, and AI-powered chat assistance through OpsOrch Copilot.

## Editions

OpsOrch Console is available in two editions built from a single codebase:

- **OSS Edition** - Open source features including incidents, logs, metrics, tickets, services, and settings
- **Enterprise Edition** - All OSS features plus AI-powered Copilot assistance and chat history

The edition is controlled at build time via the `OPSORCH_EDITION` environment variable.

## Features

- **Incidents**: Browse, search, and view incident details with timelines. Advanced filtering by query, status, severity, and scope
- **Alerts**: View and search alerts from monitoring providers. Filter by status, severity, service, and more
- **Logs**: Query and analyze logs across integrated providers with advanced search and filtering
- **Metrics**: Visualize and query metrics data with customizable expressions and aggregations
- **Services**: Explore service catalog and dependencies
- **Tickets**: View and manage tickets from integrated ticketing systems
- **Chat**: AI-powered assistance via OpsOrch Copilot for incident investigation, log analysis, and operational queries. Copilot can generate smart references to filtered views with query parameters
- **Settings**: Configure OpsOrch Core and Copilot endpoints

### Query Capabilities

All primary data views (Incidents, Alerts, Logs, Metrics) support:
- **URL-based filtering**: Share filtered views via URL with query parameters
- **Advanced search**: Free-text search across titles and descriptions
- **Status/Severity filters**: Multi-select filtering with comma-separated values
- **Scope filtering**: Filter by service, environment, and team
- **Copilot integration**: AI can generate filtered views and include them as clickable references


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
# OSS Edition (default)
npm run dev
# or explicitly
npm run dev:oss

# Enterprise Edition
npm run dev:enterprise
```

Open [http://localhost:3000](http://localhost:3000) to access the console.

### Environment Configuration

The console can be configured via environment variables or through the Settings page in the UI.

**Edition Control:**
- `NEXT_PUBLIC_OPSORCH_EDITION` - Set to `oss` or `enterprise` (default: `oss`)

**Service Endpoints:**
- `NEXT_PUBLIC_OPSORCH_CORE_URL` - OpsOrch Core URL (default: `http://localhost:8080`)
- `NEXT_PUBLIC_COPILOT_URL` - OpsOrch Copilot URL (default: `http://localhost:6060`)

**Runtime Configuration:**
- Navigate to Settings (`/settings`) in the UI to configure endpoints without restarting

### Production Build

Build the production bundle:

```bash
# OSS Edition (default)
npm run build
# or explicitly
npm run build:oss

# Enterprise Edition
npm run build:enterprise

# Start the server
npm start
```

### Testing

Run the test suite:

```bash
npm test
```

## Project Structure

- `app/` - Next.js app router pages and layouts
  - `(oss)/` - OSS Edition routes (incidents, logs, metrics, tickets, services, settings)
  - `(enterprise)/` - Enterprise Edition routes (Copilot home, chat history)
  - `components/` - Reusable React components
    - `(enterprise)/` - Enterprise-only components (CopilotPanel, etc.)
  - `api/` - API routes
    - `(enterprise)/` - Enterprise-only API routes (Copilot APIs)
  - `lib/` - Utility functions and API clients (shared between editions)

**Note:** Directories with parentheses `(oss)` and `(enterprise)` are Next.js route groups that organize code without affecting URLs.

## Licensing

OpsOrch Console uses a dual-licensing model:

### OSS Edition - Apache 2.0 License

The OSS Edition and all shared components are licensed under the **Apache License 2.0**. See the [LICENSE](LICENSE) file for details.

This includes:
- All code in `app/(oss)/` directory
- Shared components in `app/components/` (excluding `(enterprise)` subdirectory)
- Shared utilities in `app/lib/`
- Shared API routes in `app/api/` (excluding `(enterprise)` subdirectory)

### Enterprise Edition - Commercial License

The Enterprise Edition features are proprietary and licensed under the **OpsOrch Commercial License**. See the [LICENSE-ENTERPRISE](LICENSE-ENTERPRISE) file for details.

This includes:
- All code in `app/(enterprise)/` directory
- Enterprise components in `app/components/(enterprise)/`
- Enterprise API routes in `app/api/(enterprise)/`

**Enterprise features require a valid OpsOrch Enterprise License Agreement.** For licensing inquiries, contact: license@opsorch.com

### Directory Structure and Licensing

The codebase is organized to make licensing clear:

```
app/
├── (oss)/                    # Apache 2.0 - OSS routes
├── (enterprise)/             # Commercial - Enterprise routes
├── components/
│   ├── (enterprise)/         # Commercial - Enterprise components
│   └── [shared components]   # Apache 2.0 - Shared components
├── api/
│   ├── (enterprise)/         # Commercial - Enterprise APIs
│   └── [shared APIs]         # Apache 2.0 - Shared APIs
└── lib/                      # Apache 2.0 - Shared utilities
```

Files in `(enterprise)` directories are proprietary and not included in open-source distributions.

## Learn More

- [OpsOrch Core Documentation](../opsorch-core/README.md)
- [OpsOrch Copilot Documentation](../opsorch-copilot/README.md)
- [Next.js Documentation](https://nextjs.org/docs)

