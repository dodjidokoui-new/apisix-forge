# APISIX Forge

> API Gateway sécurisé · WAF intégré · Dashboard IA

Stack complète self-hosted déployable en une commande :
- **Apache APISIX** 3.11 — API Gateway haute performance
- **Coraza WAF** — WebAssembly, OWASP CRS préconfigurée
- **Prometheus + Grafana** — Observabilité temps réel
- **Loki + Promtail** — Agrégation logs WAF

## Démarrage rapide

```bash
git clone https://github.com/ton-username/apisix-forge
cd apisix-forge
docker compose up -d
```

## Accès

| Service | URL | Credentials |
|---|---|---|
| APISIX Admin API | http://localhost:9180 | X-API-KEY: apisixforge-admin-key |
| Grafana | http://localhost:3000 | admin / apisixforge |
| Prometheus | http://localhost:9090 | — |
| Loki | http://localhost:3100 | — |

## Licence

Apache 2.0
