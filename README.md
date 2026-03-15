# OpsOrch Console

OpsOrch Console is the operator UI for OpsOrch. It provides incidents, alerts, logs, metrics, orchestration, services, tickets, teams, settings, and Copilot chat in a single open-source app.

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Default endpoints:
- Core: `http://localhost:8080`
- Copilot: `http://localhost:6060`

Useful env vars:
- `NEXT_PUBLIC_OPSORCH_CORE_URL`
- `NEXT_PUBLIC_COPILOT_URL`

## Build

```bash
npm run build
npm start
```

## Test

```bash
npm test
```

## Docker

```bash
docker pull ghcr.io/opsorch/opsorch-console:latest

docker run -d \
  --name opsorch-console \
  -p 3000:3000 \
  -e NEXT_PUBLIC_OPSORCH_CORE_URL=http://localhost:8080 \
  -e NEXT_PUBLIC_COPILOT_URL=http://localhost:6060 \
  ghcr.io/opsorch/opsorch-console:latest
```

## License

Apache-2.0. See [LICENSE](LICENSE).
