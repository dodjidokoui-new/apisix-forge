import { getRoutes, getConsumers } from '@/lib/apisix';

async function getStats() {
  try {
    const [routes, consumers] = await Promise.all([
      getRoutes(),
      getConsumers(),
    ]);
    return {
      routes: routes.total ?? 0,
      consumers: consumers.total ?? 0,
    };
  } catch {
    return { routes: 0, consumers: 0 };
  }
}

export default async function HomePage() {
  const stats = await getStats();

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-8">Overview</h1>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <p className="text-zinc-400 text-sm mb-1">Routes</p>
          <p className="text-3xl font-semibold">{stats.routes}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <p className="text-zinc-400 text-sm mb-1">Consumers</p>
          <p className="text-3xl font-semibold">{stats.consumers}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <p className="text-zinc-400 text-sm mb-2">Services</p>
          <div className="space-y-2">
            {[
              { name: 'APISIX', port: 9080 },
              { name: 'Grafana', port: 3000 },
              { name: 'Prometheus', port: 9090 },
              { name: 'Loki', port: 3100 },
            ].map(({ name, port }) => (
              <div key={name} className="flex items-center justify-between">
                <span className="text-sm">{name}</span>
                <span className="text-xs text-zinc-500">:{port}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <p className="text-zinc-400 text-sm mb-2">WAF</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-sm">Coraza actif</span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">OWASP CRS 4.0</p>
        </div>
      </div>
    </div>
  );
}
