# APISIX Forge

APISIX Forge is an open-source API gateway management platform built on top of Apache APISIX. It provides a complete self-hosted stack combining a high-performance API gateway, an integrated WebAssembly WAF, full observability, and a management dashboard — deployable in minutes with a single command.

## The problem it solves

Deploying Apache APISIX in a secure, production-ready configuration typically takes several days of work for an experienced engineer. The official Apache APISIX Dashboard was deprecated in 2023 and does not cover security-oriented use cases. Existing enterprise alternatives such as Kong Enterprise or AWS API Gateway cost between 20,000 and 100,000 euros per year and introduce vendor lock-in.

APISIX Forge fills this gap by packaging everything into a single Docker Compose stack: gateway, WAF, observability, and a management UI. No manual configuration files, no vendor subscription, no cloud dependency.

## What it includes

| Component | Role |
|---|---|
| Apache APISIX 3.11 | API gateway — Nginx/OpenResty |
| Coraza WAF 0.5.0 | WebAssembly WAF with OWASP CRS 4.0 |
| etcd 3.5 | Distributed configuration store |
| Prometheus 2.47 | Metrics collection, 15-day retention |
| Grafana 10.4 | Pre-configured dashboards for gateway and WAF |
| Loki 2.9 | Structured log aggregation |
| Promtail 2.9 | Log collection with Coraza event parsing |
| Next.js dashboard | Management UI — routes, consumers, WAF feed |
| httpbin | Test backend for development and plugin testing |

## Dashboard features

**Routes**: create, edit, enable, disable, and delete routes. Configure URI, HTTP methods, upstream host, load balancing strategy (roundrobin, chash, ewma, least_conn), priority, and route name. Available plugins with advanced options:
- Coraza WAF (rule engine mode, debug level)
- Rate Limit (rate, burst, key, rejected code)
- JWT Auth (header name, algorithm, expiry)
- Key Auth (header name)
- CORS (origins, methods, headers, max age)
- Prometheus (prefer_name enabled by default)

**Consumers**: create consumers with key-auth or jwt-auth. API keys and JWT secrets are generated automatically and displayed once at creation with show and copy controls.

**WAF**: live feed of Coraza block events pulled from Loki every 5 seconds, with severity badge, rule ID, source IP, and targeted URI. Links to the Grafana WAF dashboard for full observability.

**Overview**: real-time health status of all services with latency indicators, route and consumer counts, and a log of the 5 most recently modified routes and created consumers.

**Settings**: stack version summary and security notice.

## Grafana dashboards

Two dashboards are provisioned automatically at startup:

**APISIX Gateway** — requests per route, RPS by status code, latency percentiles (P50/P90/P95/P99) for request/APISIX/upstream, bandwidth by type, Nginx connection states, etcd modify indexes.

**Coraza WAF** — total blocked requests, unique IPs blocked, unique URIs attacked, WAF events over time, live log feed, top blocked IPs table, top attacked URIs table, top HTTP methods blocked.

## Requirements

- Ubuntu 20.04 or later, Debian 11 or later
- Docker Engine with Docker Compose v2
- 4 vCPUs minimum
- 8 GB RAM minimum
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

httpbin is included as a test backend. Once the stack is running, create a route from the dashboard pointing to httpbin:80 and use any of its endpoints to test plugins:

```bash
# Test a basic route
curl http://localhost:9080/get

# Test WAF blocking
curl "http://localhost:9080/get?q=<script>alert(1)</script>"

# Test rate limiting
for i in {1..20}; do curl -s http://localhost:9080/get -o /dev/null; done
```

## Architecture

All services run on a shared Docker bridge network (apisix-net). The dashboard communicates with APISIX via the Admin API and with Loki directly for WAF log queries. Promtail collects Docker container logs and parses Coraza WAF events into structured Loki streams with labels (job, waf_action, client_ip, method, request_uri, rule_id, severity).

## Security notice

All default credentials are intentionally simple for local development. Before exposing this stack on any network:

- Rotate the APISIX Admin API key in config/apisix/config.yaml and the dashboard environment variables
- Change the Grafana admin password via the GF_SECURITY_ADMIN_PASSWORD environment variable
- Restrict the allow_admin IP range in config/apisix/config.yaml
- Place the Admin API and dashboard behind a VPN or firewall — never expose them publicly

## Roadmap

- V0.2: live route configuration updates via SSE, plugin editor with JSON schema forms, import/export
- V0.3: WAF rule management from the dashboard, IP blocklisting, custom CRS directives
- V1.0: AI agent with Claude tool use for natural language configuration and WAF analysis
- V1.x: SSO (OIDC, Entra ID), multi-tenant namespaces, Kubernetes Helm chart

## License

Apache 2.0
