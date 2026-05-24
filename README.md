# APISIX Forge

APISIX Forge is an open-source API gateway management platform built on top of Apache APISIX. It provides a complete self-hosted stack combining a high-performance API gateway, an integrated WebAssembly WAF, full observability, and a management dashboard deployable in a few minutes with Docker Compose.

## The problem it solves

Deploying Apache APISIX in a secure, production-ready configuration typically takes several days of work for an experienced engineer.

APISIX Forge fills this gap by packaging everything into a single Docker Compose stack: gateway, WAF, observability, and a management UI. No manual configuration files, no vendor subscription, no cloud dependency.

## What it includes

| Component | Role |
|---|---|
| Apache APISIX | API gateway, Nginx/OpenResty |
| Coraza WAF | WebAssembly WAF with OWASP CRS 4.0 |
| etcd | Distributed configuration store |
| Prometheus | Metrics collection, 15-day retention |
| Grafana | Pre-configured dashboards for gateway and WAF |
| Loki | Structured log aggregation with Coraza event parsing |
| Promtail | Log collection and label extraction |
| Next.js dashboard | Management UI, routes, consumers, WAF feed |
| httpbin | Test backend included for development |

## Dashboard features

**Routes**: create, edit, enable, disable, and delete routes. Configure URI, HTTP methods, upstream host, load balancing strategy, priority, and route name. Available plugins with advanced options:
- Coraza WAF (rule engine mode, debug level)
- Rate Limit (rate, burst, key, rejected code)
- JWT Auth (header name, algorithm, expiry)
- Key Auth (header name)
- CORS (origins, methods, headers, max age)
- Prometheus (prefer_name enabled by default for readable Grafana labels)

**Consumers**: create consumers with key-auth or jwt-auth. Credentials are generated automatically and displayed once at creation with show and copy controls.

**WAF**: live feed of Coraza block events pulled from Loki every 5 seconds. Displays severity, rule ID, source IP, and targeted URI. Links to the Grafana WAF dashboard for deeper analysis.

**Overview**: real-time health status of all services with latency indicators, route and consumer counts, and a log of recent activity.

**Settings**: stack version summary and security notice.

## Grafana dashboards

Two dashboards are provisioned automatically at startup.

**APISIX Gateway** requests per route (donut), RPS by status code, RPS per service/route, request latency P50/P90/P95/P99, APISIX latency P50/P90/P95/P99, upstream latency P50/P90/P95/P99 per node, bandwidth ingress/egress, Nginx connection states, etcd modify indexes, etcd reachability.

**Coraza WAF** *(work in progress improvements planned)* total blocked requests, unique IPs blocked, unique URIs attacked, WAF events over time, live log feed filtered on Coraza events, top blocked IPs table, top attacked URIs table, top blocked HTTP methods. The Loki parsing pipeline is functional but further tuning is planned to reduce access log noise in the live feed panel.

## Requirements

- Ubuntu 20.04 or later, Debian 11 or later
- Docker Engine with Docker Compose v2
- 2 vCPUs minimum
- 4 GB RAM minimum
- 40 GB disk space

## Getting started

Clone the repository:

```bash
git clone https://github.com/dodjidokoui-new/apisix-forge.git
cd apisix-forge
```

Build the custom APISIX image with Coraza WAF embedded:

```bash
docker build --network=host -f docker/Dockerfile.apisix -t apisix-forge:latest .
```

Build the dashboard image:

```bash
docker build --network=host -f dashboard/Dockerfile -t apisix-forge-dashboard:latest dashboard/
```

Start the full stack:

```bash
docker compose up -d
```

## Access

| Service | URL | Credentials |
|---|---|---|
| Dashboard | http://localhost:3001 | None |
| Grafana | http://localhost:3000 | admin / apisixforge |
| APISIX gateway | http://localhost:9080 | None |
| APISIX Admin API | http://localhost:9180 | X-API-KEY: apisixforge-admin-key |
| Prometheus | http://localhost:9090 | None |
| Loki | http://localhost:3100 | None |
| httpbin (test backend) | http://localhost:8080 | None |

## Testing with httpbin

httpbin is included as a test backend. Create a route from the dashboard pointing to `httpbin:80` and use any of its endpoints to test plugins:

```bash
# Test a basic route
curl http://localhost:9080/get

# Test WAF blocking XSS
curl "http://localhost:9080/get?q=<script>alert(1)</script>"

# Test WAF blocking SQLi
curl "http://localhost:9080/get?id=1' OR '1'='1"

# Test WAF blocking path traversal
curl "http://localhost:9080/get?file=../../../etc/passwd"

# Generate traffic for Grafana metrics
for i in {1..30}; do curl -s http://localhost:9080/get -o /dev/null; sleep 0.3; done
```

## Architecture

All services run on a shared Docker bridge network (`apisix-net`). The dashboard communicates with APISIX via the Admin API and queries Loki directly for WAF log feeds. Promtail collects Docker container logs and parses Coraza WAF events into structured Loki streams with labels: `job`, `waf_action`, `client_ip`, `method`, `request_uri`, `rule_id`, `severity`. Coraza WAF is compiled to WebAssembly and integrated natively into APISIX with zero network overhead.

## Current status

This project is under active development. The core stack is stable and functional in a local environment. The following areas are still being improved:

- Grafana WAF dashboard: Loki query tuning to cleanly separate Coraza block events from access logs in the live feed panel
- WAF rule management from the dashboard (planned for V0.3)
- IP blocklisting in one click from the WAF feed (planned for V0.3)
- AI agent for natural language configuration (planned for V1.0)

Contributions and feedback are welcome.

## Security notice

All default credentials are intentionally simple for local development. Before exposing this stack on any network:

- Rotate the APISIX Admin API key in `config/apisix/config.yaml` and the dashboard environment variables
- Change the Grafana admin password via the `GF_SECURITY_ADMIN_PASSWORD` environment variable
- Restrict the `allow_admin` IP range in `config/apisix/config.yaml`
- Place the Admin API and dashboard behind a VPN or firewall

## Roadmap

- V0.2: live route updates via SSE, plugin editor with JSON schema forms, import/export configuration
- V0.3: WAF rule management, IP blocklisting, custom CRS directives from the dashboard
- V1.x: SSO (OIDC, Entra ID), multi-tenant namespaces, Kubernetes Helm chart

## License

Apache 2.0
