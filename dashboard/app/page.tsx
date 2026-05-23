'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Route, Consumer, ServiceHealth } from '@/types';

// ─── Constants ───────────────────────────────────────────────────────────────

const SERVICES: Pick<ServiceHealth, 'name' | 'url'>[] = [
  { name: 'APISIX', url: '/api/health/apisix' },
  { name: 'etcd', url: '/api/health/etcd' },
  { name: 'Prometheus', url: '/api/health/prometheus' },
  { name: 'Grafana', url: '/api/health/grafana' },
  { name: 'Loki', url: '/api/health/loki' },
];

interface Stats {
  routes: number;
  consumers: number;
}

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
  const [stats, setStats] = useState<Stats>({ routes: 0, consumers: 0 });
  const [recentRoutes, setRecentRoutes] = useState<Route[]>([]);
  const [recentConsumers, setRecentConsumers] = useState<Consumer[]>([]);

  const checkHealth = useCallback(async () => {
    const results = await Promise.all(
      SERVICES.map(async service => {
        const start = Date.now();
        try {
          const res = await fetch(service.url);
          const latency = Date.now() - start;
          return { ...service, status: res.ok ? 'up' as const : 'down' as const, latency };
        } catch {
          return { ...service, status: 'down' as const };
        }
      })
    );
    setServices(results);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [routesRes, consumersRes] = await Promise.all([
        fetch('/api/routes'),
        fetch('/api/consumers'),
      ]);

      const [routesData, consumersData] = await Promise.all([
        routesRes.json(),
        consumersRes.json(),
      ]);

      const routes: Route[] = routesData.list?.map((r: { value: Route }) => r.value) ?? [];
      const consumers: Consumer[] = consumersData.list?.map((c: { value: Consumer }) => c.value) ?? [];

      setStats({ routes: routes.length, consumers: consumers.length });

      setRecentRoutes(
        [...routes].sort((a, b) => b.update_time - a.update_time).slice(0, 5)
      );
      setRecentConsumers(
        [...consumers]
          .sort((a, b) => (b.create_time ?? 0) - (a.create_time ?? 0))
          .slice(0, 5)
      );
    } catch {
      // Silently fail — individual panels show their own error states
    }
  }, []);

  useEffect(() => {
    checkHealth();
    fetchData();
    const interval = setInterval(checkHealth, 15_000);
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
      <div className="grid grid-cols-2 gap-4 mb-8">
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
                  {consumer.create_time && (
                    <span className="text-xs text-zinc-600 flex-shrink-0 ml-2">
                      {new Date(consumer.create_time * 1000).toLocaleDateString('en-GB')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
