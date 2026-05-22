'use client';

import { useState, useEffect } from 'react';

interface Route {
  id: string;
  uri: string;
  status: number;
  plugins?: Record<string, unknown>;
  upstream?: {
    nodes: Record<string, number>;
  };
}

export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uri, setUri] = useState('');
  const [upstream, setUpstream] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function fetchRoutes() {
    try {
      const res = await fetch('/api/routes');
      const data = await res.json();
      setRoutes(data.list?.map((r: { value: Route }) => r.value) ?? []);
    } catch {
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!uri || !upstream) return;
    setSubmitting(true);
    try {
      await fetch('/api/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri, upstream }),
      });
      setUri('');
      setUpstream('');
      setShowForm(false);
      fetchRoutes();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/routes/${id}`, { method: 'DELETE' });
    fetchRoutes();
  }

  useEffect(() => { fetchRoutes(); }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Routes</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-white text-zinc-900 text-sm px-4 py-2 rounded-md hover:bg-zinc-200 transition-colors"
        >
          + Nouvelle route
        </button>
      </div>

      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <h2 className="text-sm font-medium mb-4">Créer une route</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">URI</label>
              <input
                type="text"
                value={uri}
                onChange={e => setUri(e.target.value)}
                placeholder="/api/v1/*"
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Upstream (host:port)</label>
              <input
                type="text"
                value={upstream}
                onChange={e => setUpstream(e.target.value)}
                placeholder="backend:8080"
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCreate}
                disabled={submitting}
                className="bg-white text-zinc-900 text-sm px-4 py-2 rounded-md hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Création...' : 'Créer'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="text-zinc-400 text-sm px-4 py-2 rounded-md hover:text-white transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-zinc-500 text-sm">Chargement...</p>
      ) : routes.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center">
          <p className="text-zinc-400">Aucune route configurée</p>
        </div>
      ) : (
        <div className="space-y-3">
          {routes.map(route => (
            <div key={route.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="font-mono text-sm">{route.uri}</p>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-zinc-500 text-xs">ID: {route.id}</p>
                  {route.upstream && (
                    <p className="text-zinc-500 text-xs">
                      → {Object.keys(route.upstream.nodes)[0]}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {route.plugins && Object.keys(route.plugins).map(plugin => (
                  <span key={plugin} className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded">
                    {plugin}
                  </span>
                ))}
                <div className={`w-2 h-2 rounded-full ${route.status === 1 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <button
                  onClick={() => handleDelete(route.id)}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
