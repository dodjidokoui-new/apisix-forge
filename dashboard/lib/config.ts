/**
 * Centralized server-side configuration.
 *
 * All values are read from environment variables at runtime.
 * Never import this module from client components — it is server-side only.
 * Set overrides in .env.local for local development.
 */
export const config = {
  apisix: {
    adminUrl: process.env.APISIX_ADMIN_URL ?? 'http://apisix:9180',
    adminKey: process.env.APISIX_ADMIN_KEY ?? 'apisixforge-admin-key',
  },
  grafana: {
    url: process.env.GRAFANA_URL ?? 'http://grafana:3000',
  },
  prometheus: {
    url: process.env.PROMETHEUS_URL ?? 'http://prometheus:9090',
  },
  loki: {
    url: process.env.LOKI_URL ?? 'http://loki:3100',
  },
} as const;
