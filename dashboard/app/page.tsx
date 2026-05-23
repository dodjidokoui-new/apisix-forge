'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ServiceHealth {
  name: string;
  url: string;
  status: 'up' | 'down' | 'loading';
  latency?: number;
}

interface Route {
  id: string;
  uri: string;
  status: number;
  update_time: number;
  plugins?: Record<string, unknown>;
}

interface Consumer {
  username: string;
  create_time: number;
  plugins?: Record<string, unknown>;
}

interface Stats {
  routes: number;
  consumers: number;
  wafBlocks: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SERVICES = [
  { name: 'APISIX', url: '/api/health/apisix' },
  { name: 'etcd', url: '/api/health/etcd' },
  { name: 'Prometheus', url: '/api/health/prometheus' },
  { name: 'Grafana', url: '/api/health/grafana' },
  { name: 'Loki', url: '/api/health/loki' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusDot({ status }: { status: ServiceHealth['status'] }) {
  if (status === 'loading') return <div className="w-2 h-2 rounded-full bg-zinc-600 animate-pulse" />;
  if (status === 'up') return <div className="w-2 h-2 rounded-full bg-green-500" />;
  return <div className="w-2 h-2 rounded-full bg-red-500" />;
}

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
      <p className="text-zinc-400 text-xs mb-1">{label}</p>
      <p className="text-3xl font-semibold">{value}</p>
      {sub && <p className="text-zinc-600 text-xs mt-1">{sub}</p>}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OverviewPage() {
  const [services, setServices] = useState<ServiceHealth[]>(
    SERVICES.map(s => ({ ...s, status: 'loading' as const }))
  );
  const [stats, setStats] = useState<Stats>({ routes: 0, consumers: 0, wafBlocks: 0 });
  const [recentRoutes, setRecentRoutes] = useState<Route[]>([]);
  const [recentConsumers, setRecentConsumers] = useState<Consumer[]>([]);

  // Check health of all services
  const checkHealth = useCallback(async () => {
    const results = await Promise.all(
      SERVICES.map(async service => {
        const start = Date.now();
        try {
          const res = await fetch(service.url);
          const latency = Date.now() - start;
          return {
            ...service,
            status: res.ok ? 'up' as const : 'down' as const,
            latency,
          };
        } catch {
          return { ...service, status: 'down' as const };
        }
      })
    );
    setServices(results);
  }, []);

  // Fetch routes, consumers and WAF stats
  const fetchData = useCallback(async () => {
    try {
      const [routesRes, consumersRes, wafRes] = await Promise.all([
        fetch('/api/routes'),
        fetch('/api/consumers'),
        fetch('/api/waf/logs'),
      ]);

      const [routesData, consumersData, wafData] = await Promise.all([
        routesRes.json(),
        consumersRes.json(),
        wafRes.json(),
      ]);

      const routes: Route[] = routesData.list?.map((r: { value: Route }) => r.value) ?? [];
      const consumers: Consumer[] = consumersData.list?.map((c: { value: Consumer }) => c.value) ?? [];

      setStats({
        routes: routes.length,
        consumers: consumers.length,
        wafBlocks: wafData.events?.length ?? 0,
      });

      // Sort by update_time descending and take last 5
      setRecentRoutes(
        [...routes].sort((a, b) => b.update_time - a.update_time).slice(0, 5)
      );

      // Sort by create_time descending and take last 5
      setRecentConsumers(
        [...consumers].sort((a, b) => b.create_time - a.create_time).slice(0, 5)
      );
    } catch {
      // Silently fail — individual panels show their own errors
    }
  }, []);

  useEffect(() => {
    checkHealth();
    fetchData();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, [checkHealth, fetchData]);

  const allUp = services.every(s => s.status === 'up');

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Overview</h1>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${allUp ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-zinc-400">{allUp ? 'All systems operational' : 'Degraded'}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Routes" value={stats.routes} />
        <StatCard label="Consumers" value={stats.consumers} />
        
      </div>

      {/* Service health */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 mb-6">
        <p className="text-xs text-zinc-400 uppercase tracking-wider mb-4">Service health</p>
        <div className="space-y-3">
          {services.map(service => (
            <div key={service.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StatusDot status={service.status} />
                <span className="text-sm">{service.name}</span>
              </div>
              <div className="flex items-center gap-3">
                {service.latency !== undefined && service.status === 'up' && (
                  <span className="text-xs text-green-500 font-mono">{service.latency}ms</span>
                )}
                <span className={`text-xs font-mono ${
                  service.status === 'loading' ? 'text-zinc-600' :
                  service.status === 'up' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {service.status === 'loading' ? 'checking...' : service.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-2 gap-4">
        {/* Recent routes */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <p className="text-xs text-zinc-400 uppercase tracking-wider mb-4">Recent routes</p>
          {recentRoutes.length === 0 ? (
            <p className="text-zinc-600 text-sm">No routes yet</p>
          ) : (
            <div className="space-y-3">
              {recentRoutes.map(route => (
                <div key={route.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      route.status === 1 ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="font-mono text-xs truncate">{route.uri}</span>
                  </div>
                  <span className="text-xs text-zinc-600 flex-shrink-0 ml-2">
                    {new Date(route.update_time * 1000).toLocaleDateString('en-GB')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent consumers */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <p className="text-xs text-zinc-400 uppercase tracking-wider mb-4">Recent consumers</p>
          {recentConsumers.length === 0 ? (
            <p className="text-zinc-600 text-sm">No consumers yet</p>
          ) : (
            <div className="space-y-3">
              {recentConsumers.map(consumer => (
                <div key={consumer.username} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-xs truncate">{consumer.username}</span>
                    {consumer.plugins && Object.keys(consumer.plugins).map(p => (
                      <span key={p} className="text-xs bg-blue-900 text-blue-300 px-1.5 py-0.5 rounded flex-shrink-0">
                        {p}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-zinc-600 flex-shrink-0 ml-2">
                    {new Date(consumer.create_time * 1000).toLocaleDateString('en-GB')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}