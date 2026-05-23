# APISIX Forge

APISIX Forge is an open-source management dashboard built on top of Apache APISIX. It provides a unified interface to configure routes, manage consumers, monitor WAF activity, and observe gateway metrics, without requiring manual interaction with the Admin API or writing configuration files by hand.

## The problem it solves

Deploying Apache APISIX in a secure, production-ready configuration typically takes several days of work for an experienced engineer. The official Apache APISIX Dashboard was deprecated in 2023 and does not cover security-oriented use cases such as WAF configuration, audit trails, or observability. Existing enterprise alternatives such as Kong Enterprise or AWS API Gateway cost between 20,000 and 100,000 euros per year and introduce vendor lock-in.

APISIX Forge fills this gap by providing a single installable tool that combines API gateway management, integrated WAF, full observability, and a security-focused dashboard. It is entirely self-hosted, requires no subscription, and is licensed under Apache 2.0.

## What it includes

APISIX Forge deploys and connects the following components:

- **Apache APISIX 3.11** as the API gateway, built on Nginx/OpenResty
- **Coraza WAF** compiled to WebAssembly, integrated natively into APISIX with the OWASP Core Rule Set 4.0
- **etcd 3.5** as the distributed configuration store
- **Prometheus** for metrics collection with a 15-day retention period
- **Grafana** with two pre-configured dashboards: one for gateway metrics and one for WAF activity
- **Loki and Promtail** for structured log aggregation, with automatic parsing of Coraza WAF events into labeled streams
- **A Next.js dashboard** for managing routes, consumers, and monitoring WAF events in real time

## What the dashboard covers

**Routes**: create, edit, enable, disable, and delete routes. Configure HTTP methods, upstream host and load balancing strategy, priority, and plugins. Available plugins include Coraza WAF, rate limiting, JWT authentication, key authentication, CORS, and Prometheus metrics. Each plugin exposes its configuration options directly in the interface.

**Consumers**: create consumers with key-auth or jwt-auth. API keys and JWT secrets are generated automatically and displayed once at creation time with show and copy controls.

**WAF**: live feed of Coraza block events sourced from Loki, with severity, rule ID, source IP, and targeted URI.

**Overview**: real-time health status of all services with latency indicators, route and consumer counts, and a log of recent activity.

## Stack

| Component | Version |
|---|---|
| Apache APISIX | 3.11.0 |
| Coraza WAF | 0.5.0 |
| OWASP Core Rule Set | 4.0.0-rc2 |
| etcd | 3.5.17 |
| Prometheus | 2.47.0 |
| Grafana | 10.4.0 |
| Loki | 2.9.0 |
| Node.js | 24.x |
| Next.js | 16.x |

## Requirements

- Ubuntu 20.04 or later, Debian 11 or later
- Docker and Docker Compose v2
- Node.js 24.x
- 4 vCPUs and 8 GB RAM minimum
- 40 GB disk space

## Getting started

Clone the repository:

```bash
git clone https://github.com/dodjidokoui-new/apisix-forge.git
cd apisix-forge
```

Build the custom APISIX image with Coraza embedded:

```bash
docker build --network=host -f docker/Dockerfile.apisix -t apisix-forge:latest .
```

Start the full stack:

```bash
docker compose up -d
```

Start the dashboard in development mode:

```bash
cd dashboard
npm install
cp .env.local.example .env.local
npm run dev -- --port 3001
```

## Access

| Service | URL | Credentials |
|---|---|---|
| Dashboard | http://localhost:3001 | None |
| APISIX Admin API | http://localhost:9180 | X-API-KEY: apisixforge-admin-key |
| Grafana | http://localhost:3000 | admin / apisixforge |
| Prometheus | http://localhost:9090 | None |
| Loki | http://localhost:3100 | None |

## Security notice

The Admin API key and Grafana password are set to default values for local use. Before exposing this stack on any network, rotate all credentials in the relevant configuration files and restrict Admin API access to trusted IP ranges only. The Admin API should never be exposed publicly.

## License

Apache 2.0
