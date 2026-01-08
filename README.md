# OpsOrch Console

[![Version](https://img.shields.io/github/v/release/OpsOrch/opsorch-console)](https://github.com/OpsOrch/opsorch-console/releases)
[![License](https://img.shields.io/github/license/OpsOrch/opsorch-console)](https://github.com/OpsOrch/opsorch-console/blob/main/LICENSE)
[![CI](https://github.com/OpsOrch/opsorch-console/workflows/CI/badge.svg)](https://github.com/OpsOrch/opsorch-console/actions)

OpsOrch Console is the operator-focused web UI for OpsOrch. It provides a unified interface for browsing and managing incidents, logs, metrics, services, tickets, and AI-powered chat assistance through OpsOrch Copilot.

## Editions

OpsOrch Console is available in two editions built from a single codebase:

- **OSS Edition** - Open source features including incidents, logs, metrics, tickets, services, orchestration, and settings
- **Enterprise Edition** - All OSS features plus AI-powered Copilot assistance and chat history

The edition is controlled at build time via the `OPSORCH_EDITION` environment variable.

## Features

- **Incidents**: Browse, search, and view incident details with timelines. Advanced filtering by query, status, severity, and scope
- **Alerts**: View and search alerts from monitoring providers. Filter by status, severity, service, and more
- **Logs**: Query and analyze logs across integrated providers with advanced search and filtering
- **Metrics**: Visualize and query metrics data with customizable expressions and aggregations
- **Services**: Explore service catalog and dependencies
- **Tickets**: View and manage tickets from integrated ticketing systems
- **Orchestration**: Browse workflow plans, launch runs, monitor run status, and complete manual steps with progress tracking
- **Chat**: AI-powered assistance via OpsOrch Copilot for incident investigation, log analysis, and operational queries. Copilot can generate smart references to filtered views with query parameters
- **Settings**: Configure OpsOrch Core and Copilot endpoints

### Query Capabilities

All primary data views (Incidents, Alerts, Logs, Metrics) support:
- **URL-based filtering**: Share filtered views via URL with query parameters
- **Advanced search**: Free-text search across titles and descriptions
- **Status/Severity filters**: Multi-select filtering with comma-separated values
- **Scope filtering**: Filter by service, environment, and team
- **Copilot integration**: AI can generate filtered views and include them as clickable references

### Copilot Answer Actions

Copilot responses can include recommended actions to trigger orchestration workflows:

- `actions` entries use the `orchestration` type and may include `id`, `name`, and `reason`
- When an `id` is present, the UI links directly to `/orchestration/plans/{id}`
- When no `id` is provided, the UI routes operators to the orchestration plan browser


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

### Docker

Docker images are automatically built and published to GitHub Container Registry with each release. Both OSS and Enterprise editions are available as separate Docker images.

#### OSS Edition

```bash
# Pull the latest OSS version
docker pull ghcr.io/opsorch/opsorch-console:latest-oss

# Run OSS edition with environment variables
docker run -d \
  --name opsorch-console-oss \
  -p 3000:3000 \
  -e NEXT_PUBLIC_OPSORCH_CORE_URL=http://localhost:8080 \
  -e NEXT_PUBLIC_OPSORCH_EDITION=oss \
  ghcr.io/opsorch/opsorch-console:latest-oss

# Or run a specific OSS version
docker pull ghcr.io/opsorch/opsorch-console:v1.0.0-oss
```

#### Enterprise Edition

```bash
# Pull the latest Enterprise version
docker pull ghcr.io/opsorch/opsorch-console:latest-enterprise

# Run Enterprise edition with environment variables
docker run -d \
  --name opsorch-console-enterprise \
  -p 3000:3000 \
  -e NEXT_PUBLIC_OPSORCH_CORE_URL=http://localhost:8080 \
  -e NEXT_PUBLIC_COPILOT_URL=http://localhost:6060 \
  -e NEXT_PUBLIC_OPSORCH_EDITION=enterprise \
  ghcr.io/opsorch/opsorch-console:latest-enterprise

# Or run a specific Enterprise version
docker pull ghcr.io/opsorch/opsorch-console:v1.0.0-enterprise
```

#### Docker Compose

For easier deployment, you can use Docker Compose:

```yaml
# docker-compose.yml
version: '3.8'
services:
  opsorch-console-oss:
    image: ghcr.io/opsorch/opsorch-console:latest-oss
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_OPSORCH_CORE_URL=http://localhost:8080
      - NEXT_PUBLIC_OPSORCH_EDITION=oss
    restart: unless-stopped

  # Uncomment for Enterprise edition
  # opsorch-console-enterprise:
  #   image: ghcr.io/opsorch/opsorch-console:latest-enterprise
  #   ports:
  #     - "3001:3000"
  #   environment:
  #     - NEXT_PUBLIC_OPSORCH_CORE_URL=http://localhost:8080
  #     - NEXT_PUBLIC_COPILOT_URL=http://localhost:6060
  #     - NEXT_PUBLIC_OPSORCH_EDITION=enterprise
  #   restart: unless-stopped
```

```bash
docker-compose up -d
```

**Available Docker tags:**
- `latest-oss` - Latest OSS Edition release
- `latest-enterprise` - Latest Enterprise Edition release  
- `v{version}-oss` - Specific OSS version tags (e.g., `v1.0.0-oss`)
- `v{version}-enterprise` - Specific Enterprise version tags (e.g., `v1.0.0-enterprise`)

The Docker images run as a non-root user and expose port 3000. Both editions support the same environment variables for configuration.

## Project Structure

- `app/` - Next.js app router pages and layouts
  - `(oss)/` - OSS Edition routes (incidents, logs, metrics, tickets, services, orchestration, settings)
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

## Releases

This project uses automated releases via GitHub Actions. Releases are triggered manually and include:

- **Semantic versioning** with configurable version bumps (major, minor, patch)
- **Edition selection** (OSS, Enterprise, or both)
- **Automated testing** and linting before release
- **Git tagging** with proper version format (`v{major}.{minor}.{patch}`)
- **Changelog generation** from commit history
- **Docker image publishing** to GitHub Container Registry (separate images for OSS and Enterprise)
- **GitHub releases** with release notes

### Creating a Release

Maintainers can create a new release by:

1. Go to the [Actions tab](https://github.com/OpsOrch/opsorch-console/actions)
2. Select the "Release" workflow
3. Click "Run workflow"
4. Choose the version bump type:
   - **patch** - Bug fixes and minor updates (1.0.0 → 1.0.1)
   - **minor** - New features, backward compatible (1.0.0 → 1.1.0)  
   - **major** - Breaking changes (1.0.0 → 2.0.0)
5. Choose the edition to build:
   - **oss** - Build only OSS Edition Docker image
   - **enterprise** - Build only Enterprise Edition Docker image
   - **both** - Build both OSS and Enterprise Docker images
6. Click "Run workflow"

The release process will automatically:
- Run all tests and linting
- Calculate the next version number
- Create and push a git tag
- Build and publish Docker images for selected editions and multiple architectures (linux/amd64, linux/arm64)
- Create a GitHub release with changelog

### Installation Options

**Docker (OSS Edition):**
```bash
docker pull ghcr.io/opsorch/opsorch-console:latest-oss
```

**Docker (Enterprise Edition):**
```bash
docker pull ghcr.io/opsorch/opsorch-console:latest-enterprise
```

**GitHub Releases:**
Download release artifacts from the [Releases page](https://github.com/OpsOrch/opsorch-console/releases).

## Learn More

- [OpsOrch Core Documentation](../opsorch-core/README.md)
- [OpsOrch Copilot Documentation](../opsorch-copilot/README.md)
- [Next.js Documentation](https://nextjs.org/docs)
